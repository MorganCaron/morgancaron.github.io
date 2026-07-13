---
layout: article
title: std::vector&lt;bool&gt;
permalink: articles/cpp/std_vector_bool
category: cpp
logo: cpp.svg
background: mountains5.webp
seo:
  title: "std::vector<bool> en C++: Pièges, proxy et meilleures alternatives"
  description: "Pourquoi std::vector<bool> est considéré comme une erreur de conception historique en C++ et comment choisir la bonne alternative."
published: true
---

**Attention à ``std::vector<bool>`` !**<br>
Découverte des problèmes de ce type, son proxy et les alternatives.

## ``std::vector<T>``

``std::vector<T>`` est un type de la bibliothèque standard (STL) qui permet de créer un **tableau de taille variable alloué sur la [heap](/articles/cpp/memory#heap)**.

Son type template permet de renseigner le type qu'on souhaite stocker dans ce tableau.<br>
Par exemple ``std::vector<int>`` permet de stocker des ``int``.

Cet objet comporte un ensemble de fonctions pour manipuler ce tableau comme ajouter, modifier, supprimer et accéder à des éléments du tableau.

En parcourant la page [``std::vector<T>`` de la documentation cppreference](https://en.cppreference.com/cpp/container/vector), on peut y trouver une [spécialisation pour le type std::vector&lt;bool&gt;](https://en.cppreference.com/cpp/container/vector#Specializations) qui attire l'attention.<br>
Regardons ce que cache réellement ce type et pourquoi avoir spécialisé ``std::vector<T>`` juste pour le type ``bool``.

## Que serait ``std::vector<bool>`` sans spécialisation ?

En C++, **un booléen n'est pas réellement un bit** (un 0 ou un 1).

Lorsqu'on créé une variable, celle-ci **doit avoir une adresse** pour y accéder.

{% highlight cpp %}
auto boolean = true;
auto address = &boolean;
{% endhighlight %}

Regardons la taille qu'occupe ce booléen en mémoire:

{% row %}
{% highlight cpp %}
auto boolean = true;
std::print("{}\n", sizeof(boolean));
{% endhighlight %}

{% highlight console %}
1
{% endhighlight %}
{% endrow %}

**1** 👌<br>
1 bit? Non, 1 [cellule mémoire](/articles/cpp/memory#byte)!<br>
Soit 8 bits, 16 bits, 32 bits ou 64 bits selon le système!<br>
Si vous êtes sur un processeur 64 bits, les cellules mémoires font 64 bits.<br>
Donc un ``std::vector<bool>`` utiliserait 64 bits pour stocker **chaque** booléen, ce qui gaspille beaucoup d'espace! 😱

> Ca va... On a des gigaoctets de RAM, inutile d'économiser la mémoire au bit près.

Certes, mais si vous stockez plusieurs millions de booléens dans un ``std::vector``, ça occupera **des Mo au lieu de Ko**, ce qui risque de poser problème.

La spécialisation du type ``std::vector<bool>`` a été créée dans le but d'apporter une solution à ce problème précis.

## Spécialisation du type ``std::vector<bool>``

Pour remédier à ce problème, il a été décidé de **mutualiser les cellules mémoires** pour y stocker **1 booléen par bit**.<br>
Ainsi, une cellule mémoire de 64 bits peut contenir **jusqu'à** 64 booléens. Cette technique s'appelle le "bit-packing".<br>
Cela semble idiot de simplicité, mais faire ceci entraine un certain nombre de **conséquences indésirables**.

Prenons un exemple:
{% row %}
{% highlight cpp %}
auto booleans = std::vector<bool>{ false, true };
auto boolean = booleans[1];
std::cout << std::boolalpha << boolean;
{% endhighlight %}

{% highlight console %}
true
{% endhighlight %}
{% endrow %}

Aucun problème, n'est-ce-pas ?<br>
Ici, ``booleans[1]`` permet d'accéder au 2ème booléen du tableau en appelant [``std::vector<bool>::operator[]``](https://en.cppreference.com/cpp/container/vector/operator_at).

Le 2ème booléen (``true``) partageant la même cellule mémoire que le 1er booléen (``false``), il doit en être **extrait** et **isolé**.<br>
Pour rappel, le type ``bool`` qu'on souhaite obtenir **doit lui aussi occuper une cellule mémoire** complète, car toute variable doit avoir une adresse.<br>
Pas d'inquiétude, l'``operator[]`` le fait pour nous et nous construit un ``bool`` d'une cellule mémoire qui contient **uniquement le booléen qui nous intéresse** dans le tableau.

Maintenant **modifions un booléen** du tableau par le biais d'une **référence**:

{% highlight cpp linenos %}
auto booleans = std::vector<bool>{ false, true };
auto& boolean = booleans[1];
boolean = false;
std::cout << std::boolalpha << booleans[1];
{% endhighlight %}

{% highlight console %}
<source>:7:7: error: non-const lvalue reference to type 'reference' (aka 'std::_Bit_reference') cannot bind to a temporary of type 'reference' (aka 'std::_Bit_reference')
    2 | auto& boolean = booleans[1];
      |       ^         ~~~~~~~~~~~
1 error generated.
Compiler returned: 1
{% endhighlight %}

Une erreur de compilation ? Essayons la même chose avec un ``std::vector<int>``:

{% row %}
{% highlight cpp linenos %}
auto numbers = std::vector<int>{ 0, 1 };
auto& number = numbers[1];
number = 2;
std::cout << numbers[1];
{% endhighlight %}

{% highlight console %}
2
{% endhighlight %}
{% endrow %}

Que se passe-t-il avec [``std::vector<bool>::operator[]``](https://en.cppreference.com/cpp/container/vector/operator_at) ?

> Contrairement à ce que l'on pourrait penser, l'appel non-const à ``operator[]`` ne retourne pas un ``bool&`` (ce qui est physiquement impossible, car les éléments du tableau [n'ont pas d'adresses distinctes](#spécialisation-du-type-stdvectorbool)).<br>
> A la place, il retourne **par valeur** un objet temporaire d'une classe interne, un **proxy** (de type [``std::vector<bool>::reference``](https://en.cppreference.com/cpp/container/vector_bool/reference)).

On touche du doigt le piège: **Le proxy**

Ce proxy contient un pointeur vers la cellule mémoire contenant le bit cible, ainsi qu'un masque binaire pour l'isoler.

Son but consiste à émuler le comportement d'une référence standard grâce à la surcharge de ses opérateurs:
- L'**opérateur d'affectation** (``operator=``) : permet de modifier directement la valeur du bit dans le tableau sous-jacent.
- L'**opérateur de conversion implicite** (``operator bool``): permet d'en lire la valeur sous forme de ``bool``.

#### Pourquoi l'écriture `auto& boolean = booleans[1];` échoue-t-elle ?

En C++, une **lvalue reference non-const** (``T&``) ne peut pas se lier à un **objet temporaire** (prvalue). Puisque l'``operator[]`` renvoie le proxy par valeur (un temporaire), le compilateur refuse de lier ``auto&`` dessus.

Si l'on retire la reference pour écrire ``auto boolean = booleans[1];``, le code compile car on stocke le proxy dans une variable locale ``boolean`` (de type ``std::vector<bool>::reference``). Cette variable locale fait office de "fausse" référence et permet de modifier le vecteur d'origine:

{% row %}
{% highlight cpp %}
auto booleans = std::vector<bool>{ false, true };
booleans[1] = false;
std::cout << std::boolalpha << booleans[1];
{% endhighlight %}

{% highlight console %}
false
{% endhighlight %}
{% endrow %}

{% row %}
{% highlight cpp %}
auto booleans = std::vector<bool>{ false, true };
auto boolean = booleans[1];
boolean = false;
std::cout << std::boolalpha << booleans[1];
{% endhighlight %}

{% highlight console %}
false
{% endhighlight %}
{% endrow %}

> **Le piège d'``auto`` et des proxies**<br>
> Ce comportement où la variable ``boolean`` **conserve un lien avec le vecteur d'origine** au lieu de copier la valeur provient de la **déduction du type proxy** (``std::_Bit_reference``) par le mot clef ``auto``. Ce **piège classique de déduction automatique** et ses risques associés (comme les **dangling references**) sont détaillés dans l'article: [**auto et l'oubli de conversion explicite**](/articles/cpp/auto#oublier-une-conversion-explicite).
{: .block-warning }

``operator[]`` (non constant) retourne un **proxy**, mais attention, **ce n'est pas le cas de sa version constante**.<br>
L'``operator[]`` **constant** quant à lui **retourne bien un ``bool`` et non un proxy**:

| ``reference operator[](size_type pos);`` | (1) (constexpr since C++20) |
| ``const_reference operator[](size_type pos) const;`` | (2) (constexpr since C++20) |

([Source: CppReference ``std::vector<bool>::operator[]``](https://en.cppreference.com/cpp/container/vector/operator_at))

| Member type | Definition |
| [``reference``](https://en.cppreference.com/cpp/container/vector_bool/reference) | proxy class representing a reference to a single bool (class) |
| [``const_reference``](https://en.cppreference.com/cpp/container/vector_bool#Member_types) | **bool** |

Il en est de même pour les fonctions ``std::vector<bool>::begin``, ``std::vector<bool>::end`` et **toute fonction qui retourne une référence ou un itérateur** sur "une valeur du tableau".

{% highlight cpp linenos %}
auto booleans = std::vector<bool>{ false, true };

for (const auto& boolean : booleans) // Ok
	std::cout << std::boolalpha << boolean << '\n';

for (auto& boolean : booleans) // Incorrect, ne compile pas
	std::cout << std::boolalpha << boolean << '\n';

for (auto boolean : booleans) // Ok
	std::cout << std::boolalpha << boolean << '\n';
{% endhighlight %}

Vous comprenez maintenant pourquoi cette spécialisation ([``std::vector<bool>``](https://en.cppreference.com/cpp/container/vector_bool)) est considérée comme une **erreur de design** dans la communauté C++, et apporte **plus de problèmes qu'elle ne permet d'en résoudre**. C'est pourquoi il est **très encouragé de l'éviter**.

## Contourner la spécialisation

Admettons que vous souhaitez instancier un ``std::vector<bool>`` par le biais de l'implémentation générale ``std::vector<T>``, **sans utiliser l'implémentation spécifique** de ``std::vector<bool>``. Est-ce possible ?

Et bien oui, par un moyen détourné: En **encapsulant** un booléen dans une **structure**.

{% highlight cpp linenos highlight_lines="9" %}
struct Bool final
{
	Bool(bool value): value{value} {}
	Bool& operator=(bool newValue) { value = newValue; return *this; }
	operator bool() const { return value; }
	bool value;
};
auto booleans = std::vector<Bool>{ false, true };
auto& boolean = booleans[1]; // Notez que cette écriture avec auto& est maintenant possible
boolean = false;
std::cout << std::boolalpha << booleans[1];
{% endhighlight %}

{% highlight console %}
false
{% endhighlight %}

Mais gardez en tête que d'une manière ou d'une autre, ça reste une **mauvaise pratique** d'avoir des **``std::vector<bool>``**, car par ce **moyen détourné** on retombe dans le problème initial de [**gaspillage de mémoire**](#que-serait-stdvectorbool-sans-spécialisation-).<br>
Et accessoirement, vous n'aurez **pas accès à la fonction membre [``std::vector<bool>::flip()``](https://en.cppreference.com/cpp/container/vector_bool/flip)**, qui n'existe que dans la spécialisation ``std::vector<bool>``.

Comme nous allons le voir par la suite, il existe de bien meilleures alternatives.

## std::array&lt;bool, N&gt;

Qu'en est-il de [``std::array<bool, N>``](https://en.cppreference.com/cpp/container/array) ? Il n'existe **aucune spécialisation** de ce conteneur pour le type **``bool``**.

Si une telle **spécialisation** existait pour **économiser de la mémoire** (via le **bit-packing**), elle **aurait souffert des mêmes défauts** de conception que ``std::vector<bool>`` ([l'usage de proxies à la place de vraies références](#spécialisation-du-type-stdvectorbool)).

**Pour les tableaux de taille fixe** connus à la compilation, le comité C++ a préféré **éviter ce piège** en créant un type entièrement distinct et **dédié à la manipulation de bits**: [**``std::bitset<N>``**](#stdbitsetn). N'étant **pas contraint de respecter l'interface des conteneurs standards** (pas d'itérateurs, pas d'opérateur d'accès direct retournant une référence standard), ``std::bitset`` peut **manipuler les bits de manière propre et spécialisée**.

## std::bitset&lt;N&gt;

[``std::bitset<N>``](https://en.cppreference.com/cpp/utility/bitset) est **le type idéal** pour stocker des **données binaires de taille fixe de N bits sur la stack**.

Tout comme la [**spécialisation de``std::vector<bool>``**](#spécialisation-du-type-stdvectorbool), ``std::bitset<N>`` ne **gaspille pas de mémoire** et **expose un proxy** pour accéder aux bits. Il propose également d'autres **fonctions utiles pour la manipulation de bits**, et est presque entièrement ``constexpr`` depuis C++23 ([proposal](https://wg21.link/p2417r2)), permettant d'effectuer des **calculs binaires dès la compilation**.

Il peut être construit à partir d'une **valeur numérique** ou **textuelle** (texte contenant le binaire en format lisible, sous forme de '0' et de '1').
Et possède également une fonction membre ``std::bitset<N>::to_string()`` pour **restituer au format texte** la valeur stockée.

{% row %}
{% highlight cpp %}
auto bitset0 = std::bitset<5>{0b01001}; // 0b01001 == 0b1001
auto bitset1 = std::bitset<5>{"01001"}; // "01001" <=> "1001"
std::cout << bitset0.to_string() << '\n';
std::cout << bitset1.to_string() << '\n';
std::cout << bitset1.to_ulong() << '\n'; // 01001 (binaire) vaut 9 (decimal)
std::cout << bitset1.to_ullong() << '\n';
{% endhighlight %}

{% highlight console %}
01001
01001
9
9
{% endhighlight %}
{% endrow %}

> Remarquez que ``std::bitset<N>::to_string()`` retourne une chaine contenant les **bits '0' de poids fort**, quand bien même ils sont **facultatifs pour représenter une valeur numérique**.

[Tout comme ``std::vector<bool>``](#spécialisation-du-type-stdvectorbool), il expose un proxy ([``std::bitset::reference``](https://en.cppreference.com/cpp/utility/bitset/reference)) pour accéder aux bits qu'il contient.

| ``bool operator[](std::size_t pos) const;`` | (1) (constexpr since C++11) |
| ``reference operator[](std::size_t pos);`` | (2) (constexpr since C++23) |

([Source: CppReference ``std::bitset<N>::operator[]``](https://en.cppreference.com/cpp/utility/bitset/operator_at))

| Member type | Definition |
| [``reference``](https://en.cppreference.com/cpp/utility/bitset/reference) | proxy class representing a reference to a bit (class) |

([Source: CppReference ``std::bitset<N>``](https://en.cppreference.com/cpp/utility/bitset#Member_types))

Proxy qui n'est présent **que dans l'``operator[]`` non-const**.

{% row %}
{% highlight cpp %}
auto bitset = std::bitset<5>{0b01001};
std::cout << bitset[1] << '\n';
{% endhighlight %}

{% highlight console %}
0
{% endhighlight %}
{% endrow %}

> L'argument de ``std::bitset<N>::operator[](std::size_t pos)`` renseignant la position du bit va **de droite à gauche**. ``bitset[0]`` étant **le bit de poids faible**.

Ce proxy:
- supporte les **casts** en ``bool``
- possède un ``operator=`` pour **modifier** le bit lié
- possède un ``operator~`` pour obtenir l'**inverse** de la valeur du bit
- possède une fonction membre ``flip()`` permettant de **faire basculer la valeur** du bit (``true`` false ``false``, ou ``false`` vers ``true``)

Ce proxy permet de modifier le bit liée.

{% row %}
{% highlight cpp %}
auto bitset = std::bitset<5>{0b01001};
bitset[1] = true;
std::cout << bitset[1] << '\n';
{% endhighlight %}

{% highlight console %}
1
{% endhighlight %}
{% endrow %}

Proxy qui, comme pour ``std::vector<bool>``, est un objet temporaire et ne peut donc pas être stocké dans une lvalue reference.

{% row %}
{% highlight cpp %}
auto bitset = std::bitset<5>{0b01001};
// auto& bit = bitset[1]; Ne compile pas
auto bit = bitset[1];
bit = true;
std::cout << bitset[1] << '\n';
{% endhighlight %}

{% highlight console %}
1
{% endhighlight %}
{% endrow %}

### Lecture de bits (``test``)

``std::bitset<N>::operator[]`` a l'avantage d'être utilisable à la fois pour lire et écrire un bit, mais **ne comporte aucune gestion d'erreur** en cas de position en dehors de [0, N-1].
Ce désavantage résulte d'un **compromis entre sécurité et performances**, il a été décidé de concevoir cet opérateur pour **maximiser les performances**.

Pour avoir cette sécurité, ``bool std::bitset<N>::test(std::size_t pos) const;`` permet de vérifier si un bit vaut ``true`` **tout en vérifiant que la position renseignée est correcte**. La fonction **retourne une exception** ``std::out_of_range`` dans le cas contraire.

### Manipulation de bits (``set``, ``reset``, ``flip``)

Pour modifier les bits en toute sécurité, [``std::bitset<N>``](https://en.cppreference.com/cpp/utility/bitset) fournit des **fonctions membres** dédiées:
* [**``set(std::size_t pos, bool value = true)``**](https://en.cppreference.com/cpp/utility/bitset/set): **Définit le bit** à la position ``pos`` à la valeur ``value`` (**``true`` par défaut**). Si aucun index n'est fourni (``set()``), définit **tous les bits à ``true``**.
* [**``reset(std::size_t pos)``**](https://en.cppreference.com/cpp/utility/bitset/reset): **Définit à ``false``** le bit à la position ``pos`` (ce qui équivaut à appeler ``set(pos, false)``). Si aucun index n'est fourni (``reset()``), **réinitialise tous les bits** à ``false``.
* [**``flip(std::size_t pos)``**](https://en.cppreference.com/cpp/utility/bitset/flip): **Inverse la valeur** du bit à la position ``pos``. Si aucun index n'est fourni (``flip()``), **inverse tous les bits** du bitset. C'est l'équivalent direct de la fonction [``std::vector<bool>::flip()``](https://en.cppreference.com/cpp/container/vector_bool/flip) mais pour un tableau de taille fixe.

> ⚠️ **Ne pas confondre [``std::bitset::flip``](https://en.cppreference.com/cpp/utility/bitset/flip) et [``std::bitset::reference::flip``](https://en.cppreference.com/cpp/utility/bitset/reference)**
>
> - ``bitset.flip()`` (sans arguments) est une méthode du bitset lui-même qui **inverse l'intégralité des bits** du conteneur.
> - ``bitset.flip(pos)`` (avec un index) inverse **uniquement le bit** à la position ``pos``.
> - ``bitset[pos].flip()`` (appelé sur le proxy retourné par l'``operator[]``) appelle la méthode ``flip()`` de la classe proxy [``std::bitset::reference``](https://en.cppreference.com/cpp/utility/bitset/reference) et **n'inverse que ce bit précis**.
{: .block-warning }

Contrairement à ``std::bitset<N>::operator[]`` qui **ne réalise aucun contrôle** pour des raisons de **performance**, ces fonctions **vérifient que l'index ``pos`` est bien compris dans l'intervalle ``[0, N-1]``** et lèvent une **exception** ``std::out_of_range`` en cas de **dépassement**. La fonction de lecture sécurisée [**``test(pos)``**](#lecture-de-bits-test) fonctionne sur le **même principe**.

> Ces fonctions **retournent une référence sur le bitset** lui-même, permettant le [**method chaining**](https://en.wikipedia.org/wiki/Method_chaining): ``bitset.set(1).reset(2).flip(3)``

### Requêtes globales (``all``, ``any``, ``none``, ``count``)

Pour **inspecter l'état global** des bits, plusieurs méthodes très rapides sont disponibles:
- [**``all()``**](https://en.cppreference.com/cpp/utility/bitset/all_any_none): Retourne ``true`` si tous les bits valent ``true``.
- [**``any()``**](https://en.cppreference.com/cpp/utility/bitset/all_any_none): Retourne ``true`` si au moins un bit vaut ``true``.
- [**``none()``**](https://en.cppreference.com/cpp/utility/bitset/all_any_none): Retourne ``true`` si aucun bit ne vaut ``true``.
- [**``count()``**](https://en.cppreference.com/cpp/utility/bitset/count): Retourne le nombre total de bits définis à ``true``.

#### Optimisation matérielle de ``count()``

La méthode [**``count()``**](https://en.cppreference.com/cpp/utility/bitset/count) est **particulièrement performante** car elle est **directement traduite** par les compilateurs modernes en **une instruction processeur dédiée** appelée **population count** ([**``popcnt``**](https://www.felixcloutier.com/x86/popcnt) sur x86/x64). Elle permet de **compter les bits** à la vitesse du processeur **sans faire de boucle logicielle**.

> Cette **optimisation matérielle** est également accessible **pour les types numériques standards depuis C++20** via la fonction [**``std::popcount``**](https://en.cppreference.com/cpp/numeric/popcount) (définie dans le header [``<bit>``](https://en.cppreference.com/cpp/header/bit)).

{% row %}
{% highlight cpp linenos %}
#include <bitset>

std::bitset<128> getBits();

auto main() -> int
{
	const auto bits = getBits();
	return static_cast<int>(bits.count());
}
{% endhighlight %}

{% highlight armasm %}
main:
        sub     rsp, 8
        call    getBits()
        add     rsp, 8
        popcnt  rax, rax
        popcnt  rdx, rdx
        add     eax, edx
        ret
{% endhighlight %}
{% endrow %}

Comme on peut le constater sur ce code compilé par GCC, l'appel à `bits.count()` sur un bitset de **128 bits** se résume à **deux** instructions matérielles ``popcnt`` (une pour **chaque mot** de **64 bits**) dont les résultats sont **sommés** (l'instruction ``add`` à la fin).

### Opérateurs et logique binaire

``std::bitset<N>`` se comporte comme un **entier de taille arbitraire** et supporte l'ensemble des **opérateurs binaires** standards:
- Les opérateurs logiques: ``&``, ``|``, ``^``, ``~`` (et leurs versions d'affectation ``&=``, ``|=``, ``^=``).
- Les opérateurs de décalage de bits: ``<<``, ``>>`` (et ``<<=``, ``>>=``).

{% highlight cpp %}
auto mask1 = std::bitset<4>{"1100"};
auto mask2 = std::bitset<4>{"1010"};

auto resultAnd = mask1 & mask2; // "1000"
auto resultOr  = mask1 | mask2; // "1110"
auto resultXor = mask1 ^ mask2; // "0110"
auto resultNot = ~mask1; // "0011"

mask1 <<= 1; // Décale à gauche: mask1 vaut maintenant "1000"
{% endhighlight %}

### Conversion entre bitsets de tailles différentes

En C++, deux instances de ``std::bitset`` de **tailles différentes** (comme ``std::bitset<4>`` et ``std::bitset<8>``) sont des **types complètement distincts** pour le compilateur. Par conséquent, il est **impossible de faire une affectation** directe ou une copie implicite.

Pour copier ou transférer le contenu d'un bitset de taille *M* vers un bitset de taille *N*, vous devez utiliser des conversions intermédiaires:

#### Pour des tailles inférieures ou égales à 64 bits
Le moyen le plus simple est de transiter par un entier non signé classique avec [``to_ullong()``](https://en.cppreference.com/cpp/utility/bitset/to_ullong). Le constructeur de ``std::bitset`` accepte un entier et s'occupera d'étendre (avec des zéros) ou de tronquer les bits de poids fort.

{% highlight cpp %}
auto small = std::bitset<4>{"1011"};

// Extension (4 -> 8 bits): devient "00001011"
auto large = std::bitset<8>{small.to_ullong()};

// Troncature (8 -> 4 bits): conserve uniquement les 4 bits de poids faible
auto large2 = std::bitset<8>{"11011011"};
auto truncated = std::bitset<4>{large2.to_ullong()}; // devient "1011"
{% endhighlight %}

> ⚠️ **Piège de l'overflow**: Si le bitset source fait plus de 64 bits, appeler ``to_ulong()`` ou ``to_ullong()`` lèvera une exception [``std::overflow_error``](https://en.cppreference.com/cpp/error/overflow_error).
{: .block-warning }

#### Pour des tailles supérieures à 64 bits
Pour les grands bitsets (> 64 bits), vous pouvez passer par une chaîne de caractères via [``to_string()``](https://en.cppreference.com/cpp/utility/bitset/to_string) (au prix d'une allocation de mémoire dynamique):

{% highlight cpp %}
auto largeSource = std::bitset<128>{...};
// Conversion via string, impliquant son coût d'allocation et de construction
auto destination = std::bitset<256>{largeSource.to_string()};
{% endhighlight %}

Alternativement, pour éviter les allocations, vous pouvez réaliser une copie bit-à-bit manuelle à l'aide d'une fonction générique:

{% highlight cpp linenos %}
template<std::size_t N, std::size_t M>
[[nodiscard]] constexpr auto castBitset(const std::bitset<M>& source) -> std::bitset<N>
{
	auto destination = std::bitset<N>{};
	constexpr auto min = N < M ? N : M;
	for (auto i = 0uz; i < min; ++i)
		destination[i] = source[i];
	return destination;
}
{% endhighlight %}

## ``std::byte`` (C++17)

Si votre besoin de stockage concerne des **octets de données** pures (par exemple, pour un **buffer réseau**, de la **sérialisation**, ou de la **lecture de fichiers binaires**), le **C++17** introduit le type standard [**``std::byte``**](https://en.cppreference.com/cpp/types/byte).

Contrairement à ``unsigned char`` ou ``std::uint8_t`` qui sont des types numériques (des entiers), **``std::byte`` n'est pas un nombre**.

Il est [défini ainsi](https://en.cppreference.com/cpp/types/byte):
{% highlight cpp %}
enum class byte : unsigned char {};
{% endhighlight %}

Par conséquent, il **interdit les opérations arithmétiques** directes (``+``, ``-``, ``*``), ce qui **évite les bugs de conversion implicite**.<br>
Et supporte **uniquement les opérations binaires** (``&``, ``|``, ``^``, ``~``, ``<<``, ``>>``).

> Etant calqué sur le type **``unsigned char``**, ``std::byte`` occupera toujours précisément **1 byte (1 [cellule mémoire](/articles/cpp/memory#byte)**), le nombre de bits d'un byte (défini par ``CHAR_BIT``) peut être supérieur à 8 sur certaines architectures.<br>
> C'est ce que nous voulons lorsque nous manipulons un **ensemble d'octets représentant une donnée**. On ne souhaite pas stocker **que 8 bits par [cellule mémoire](/articles/cpp/memory#byte)** si celles-ci sont plus grandes sur le matériel cible. Autrement on aurait un **padding de bits inutilisés** dans chaque [cellule mémoire](/articles/cpp/memory#byte).
{: .block-warning }

> C'est l'occasion de souligner qu'il fait une **bien meilleure alternative que** ``unsigned char``, ``char``, ``char8_t`` ou encore ``std::uint8_t`` pour **stocker ou manipuler des octets**.<br>
> ``std::byte`` est le **type sémantique idéal** pour un tableau (``std::array<std::byte, N>`` pour une **taille fixe**, ou ``std::vector<std::byte>`` pour une **taille dynamique**) qui contient des **octets de mémoire brute** et non des caractères ou des nombres.

> **``std::vector<std::byte>``** vs **``std::unique_ptr<std::byte[]>``**:<br>
>
> Bien que l'un comme l'autre soient [**RAII**](/articles/cpp/raii), ``std::unique_ptr<std::byte[]>`` ne dispose pas de **l'éventail de fonctions** utiles que proposent **``std::vector<T>``**, ni de mécanisme de **réallocation automatique** non plus (pour **réajuster la taille**). **``std::vector<std::byte>``** est donc définitivement **le meilleur choix** des deux pour un **buffer d'octets de taille dynamique**.
>
> Cependant, une **nuance** est à apporter pour **certaines situations**:<br>
> Si le buffer a une **taille connue à l'exécution** (et **non à la compilation**, sinon **``std::array<std::byte, N>`` serait préférable**), mais qui **n'a plus besoin de varier après son allocation**, ``std::unique_ptr<std::byte[]>`` reste une **alternative très légère**. Il évite le surcoût des **3 pointeurs internes** du vecteur (*begin*, *end* et *capacity_end*. **micro-optimisation** pas forcément nécessaire) mais surtout permet (**depuis C++20** avec **``std::make_unique_for_overwrite``**) d'allouer la mémoire **sans forcer son initialisation** à zéro.
>
> Mais attention, vous pouvez être **tenté d'utiliser ``std::unique_ptr<std::byte[]>``** pour de la **réception de paquets réseau** dont **la taille est reçue en amont de la réception des données** elles-mêmes. Je dois préciser que ce genre de réception de données réseau se fait **souvent dans une boucle** pour recevoir la donnée **paquet par paquet**. Et que par conséquent ``std::unique_ptr<std::byte[]>`` impliquerait des **destructions** et **reconstruction** (avec **réallocation**) pour chaque paquet ayant **besoin d'une taille différente**. Là où **``std::vector<std::byte>`` ajuste déjà sa [*capacity*](https://en.cppreference.com/cpp/container/vector/capacity)**.
{: .block-warning }

### Convertir un ``std::byte`` en ``unsigned char``

Comme ``std::byte`` est un type fortement typé (déclaré via une ``enum class``), il n'est **pas implicitement convertible** en types entiers. C'est une **excellente sécurité** contre les bugs, mais cela pose problème pour interagir avec des **API historiques en langage C** (comme les [sockets système](https://man7.org/linux/man-pages/man2/recv.2.html), [OpenSSL](https://docs.openssl.org/master/man3/SHA256_Init/) ou l'écriture réseau) qui s'attendent à recevoir des pointeurs vers ``unsigned char*`` ou ``char*``.

#### Pour une valeur unique

Pour convertir un ``std::byte`` en sa valeur numérique d'origine, vous devez réaliser un ``static_cast`` explicite (le cast étant trivial puisque le type sous-jacent de ``std::byte`` est garanti d'être ``unsigned char``), ou utiliser la fonction utilitaire [``std::to_integer``](https://en.cppreference.com/cpp/types/byte#Non-member_functions) définie dans [``<cstddef>``](https://en.cppreference.com/cpp/header/cstddef):

{% highlight cpp linenos %}
auto byte = std::byte{0xFF};

auto rawValue1 = static_cast<unsigned char>(byte); // 255

auto rawValue2 = std::to_integer<int>(byte); // 255 (vers n'importe quel type entier)
{% endhighlight %}

#### Pour un buffer entier

Pour passer un buffer de ``std::byte`` à une **ancienne API C**, le standard autorise l'utilisation de ``reinterpret_cast``. Grâce à la **dérogation spéciale** de [*Strict Aliasing*](https://en.cppreference.com/cpp/language/reinterpret_cast#Type_aliasing) de ``std::byte`` et ``unsigned char``, ce cast est **légal** et ne provoque **aucun comportement indéfini** (UB):

{% highlight cpp linenos %}
void legacyApi(const unsigned char* data, size_t size);

auto main() -> int
{
	auto buffer = std::vector<std::byte>{ /* ... */ };

	legacyApi(reinterpret_cast<const unsigned char*>(buffer.data()), buffer.size());
	// Ou équivalent:
	legacyApi(reinterpret_cast<const unsigned char*>(std::data(buffer)), std::size(buffer));
}
{% endhighlight %}

> Plus d'infos sur [``std::data()`` et ``std::size()``](/articles/cpp/customization_point_design).

## ``std::byte`` vs ``std::bitset<N>``

Le choix entre ``std::byte`` (manipulé individuellement ou au sein de ``std::vector<std::byte>`` / ``std::array<std::byte, N>``) et ``std::bitset<N>`` dépend de la sémantique de la donnée:

- [**``std::byte``**](#stdbyte-c17) représente de la **mémoire brute**. C'est un **conteneur d'octets**. Vous **manipulez la donnée dans sa globalité** (lecture d'un flux réseau, chargement d'un fichier).
- [**``std::bitset<N>``**](#stdbitsetn) représente un **ensemble de drapeaux binaires (flags)**. Vous **manipulez chaque bit individuellement** pour stocker des états (vrai/faux), par exemple pour représenter des [permissions](https://linux.die.net/Linux-CLI/file-permissions.html), des états d'activation, ou des options de configuration.

Voici comment ``std::bitset<N>`` facilite la gestion de **droits d'accès** grâce à ses méthodes dédiées (``.test()``, ``.set()``, ``.count()``, etc) par rapport à un masque de bits manuel sur ``std::byte``:

{% highlight cpp linenos %}
#include <bitset>
#include <cstdio>
#include <print>

enum Permission : std::size_t
{
	Read = 0,
	Write = 1,
	Execute = 2,
	Admin = 3
};

auto main() -> int
{
	// Initialisation sans permissions (tous les bits à 0)
	auto userPermissions = std::bitset<8>{};

	// On attribue des permissions par method chaining
	userPermissions.set(Read).set(Execute);

	// Lecture individuelle sécurisée via test()
	if (userPermissions.test(Read))
		std::puts("L'utilisateur peut lire le fichier");

	userPermissions.reset(Execute); // Retire le droit d'exécution
	userPermissions.flip(Write); // Alterne le droit d'écriture

	std::println("Nombre de droits actifs: {}", userPermissions.count());
	
	if (userPermissions.any())
		std::puts("L'utilisateur possède au moins un droit");
}
{% endhighlight %}

A l'inverse, voici un exemple d'utilisation de **``std::byte``** (via ``std::vector<std::byte>``) illustrant la **réception de données réseau paquet par paquet**. Dans cet exemple, la taille du paquet est lue en premier, puis le vecteur réutilise sa mémoire tampon (*capacity*) pour stocker les données lues, évitant ainsi des réallocations systématiques sur le tas:

{% highlight cpp linenos %}
#include <span>
#include <print>
#include <vector>
#include <cstddef>

// Structure de socket fictive pour l'exemple
struct Socket final
{
	[[nodiscard]] auto isOpen() const -> bool; // Indique si la connexion est active
	[[nodiscard]] auto readSize() -> std::size_t; // Retourne la taille du prochain paquet
	void readData(std::span<std::byte> destination); // Remplit le span
};

auto receivePackets(Socket& socket) -> void
{
	// Le buffer est défini hors de la boucle (pour éviter les réallocations et réutiliser la même capacité)
	auto buffer = std::vector<std::byte>{};
	
	// On réserve une capacité initiale pour limiter les premières allocations
	buffer.reserve(1024);

	while (socket.isOpen())
	{
		// On reçoit la taille du prochain paquet
		const auto payloadSize = socket.readSize();

		// On ajuste la taille du vecteur
		// Si payloadSize <= buffer.capacity(), aucune allocation n'a lieu
		buffer.resize(payloadSize);

		// On reçoit les données brutes directement dans le vecteur
		socket.readData(buffer);

		// Traitement des données du paquet
		std::println("Paquet reçu (Taille: {} octets)", std::size(buffer));
	}
}
{% endhighlight %}

> Notez la présence d'un [``std::span<std::byte>``](#stdspanstdbyte-c20) dans cet exemple (en paramètre de la fonction ``Socket::readData``). Nous en parlerons [plus bas](#stdspanstdbyte-c20).

## ``boost::dynamic_bitset``

Si la compacité mémoire (1 bit par élément) est cruciale mais que la taille doit varier dynamiquement, la **bibliothèque tierce Boost** propose [``boost::dynamic_bitset``](https://www.boost.org/doc/libs/release/libs/dynamic_bitset/dynamic_bitset.html). C'est **l'équivalent dynamique de ``std::bitset<N>``**, propre et conçu spécifiquement pour cet usage, sans chercher à se faire passer pour un vecteur.

> ⚠️ **Attention au coût de maintenance des dépendances**<br>
> Introduire une bibliothèque externe comme **Boost** dans votre projet **uniquement** pour utiliser ``boost::dynamic_bitset`` est **généralement déconseillé**. Cela **complexifie** le système de build ([CMake](https://cmake.org), [Xmake](https://xmake.io), [meson build](https://mesonbuild.com), etc), augmente les **temps de compilation**, et introduit un **risque de rupture de compatibilité** ou d'**instabilités** de version. Ne franchissez ce pas **que si Boost est déjà présent dans vos dépendances** ou si la contrainte mémoire de bits dynamiques est un goulot d'extranglement majeur. Dans le cas contraire, **préférez une alternative standard** comme ``std::vector<std::byte>``.
{: .block-warning }

## ``std::span<std::byte>`` (C++20)

Lorsque vous écrivez une fonction qui lit ou écrit dans un buffer contigu (tableau brut, ``std::array``, ``std::vector``), **forcer** l'usage d'un **conteneur spécifique** (comme ``const std::vector<std::byte>&``) est une **erreur de conception**. Cela **oblige** l'appelant à allouer de la mémoire sur le tas et à copier ses données **uniquement pour satisfaire la signature** de la fonction.

C'est pourquoi le C++ moderne privilégie les **vues non propriétaires**. Introduit en C++20 (et aperçu brièvement [ci-dessus](#stdbyte-vs-stdbitsetn)), [``std::span<std::byte>``](https://en.cppreference.com/cpp/container/span) sert de **type générique** pour représenter une vue sur n'importe lequel de ces conteneurs **sans en prendre l'*ownership* et sans réaliser de copie**.

Il existe en deux versions:
*   **``std::span<const std::byte>``**: Pour les traitements en **lecture seule**, équivalent moderne et sécurisé de ``const T* data, size_t size``.
*   **``std::span<std::byte>``**: Pour les traitements en **lecture/écriture**, permettant de modifier directement le buffer sous-jacent de l'appelant.

Contrairement à un pointeur brut, ``std::span`` regroupe un pointeur et une taille de manière sécurisée. Il connaît ses dimensions, permet d'éviter les débordements (*out-of-bounds*) et est compatible avec les *range-based for loop*.

{% highlight cpp linenos highlight_lines="2 15 16 17" %}
// La fonction accepte n'importe quelle séquence contiguë de bytes en lecture seule
auto printBytes(std::span<const std::byte> bytes) -> void
{
	for (const auto byte : bytes)
		std::print("{:02X} ", static_cast<unsigned char>(byte));
}

auto main() -> int
{
	auto bufferVector = std::vector<std::byte>{ /* ... */ };
	auto bufferArray = std::array<std::byte, 4>{ /* ... */ };
	std::byte rawArray[5]{ /* ... */ };

	// Conversion implicite et sans copie vers std::span
	printBytes(bufferVector);
	printBytes(bufferArray);
	printBytes(rawArray);
}
{% endhighlight %}

En tant que simple vue **non propriétaire de la donnée**, [``std::span``](https://en.cppreference.com/cpp/container/span) contient simplement **un pointeur sur le début de la donnée** ainsi qu'**une taille**.

> **Cette taille** n'est **pas obligée d'être la même que la donnée pointée**, elle **peut s'arrêter plus tôt**.<br>
> Mais de ce fait, la **sous-donnée** représentée par le ``span`` **ne se terminera pas par une sentinelle** ([``nullptr``](/articles/cpp/literals#pointer-literal-nullptr), ``\0``, ``0``). Cela présente un risque de *buffer overflow* si l'on extrait le pointeur brut via [``std::span<T>::data()``](https://en.cppreference.com/cpp/container/span/data) ou [``std::data()``](https://en.cppreference.com/cpp/iterator/data)[²](/articles/cpp/customization_point_design) pour le passer à des fonctions s'attendant à une sentinelle de fin.
{: .block-warning }

{% highlight cpp linenos highlight_lines="4" %}
auto characters = std::vector<char>{'H', 'e', 'l', 'l', 'o', ' ', 'W', 'o', 'r', 'l', 'd', '\0'};
auto span = std::span<char>{characters}.first(5); // Contient "Hello" (taille 5)

std::puts(std::data(span));
{% endhighlight %}

{% highlight console %}
Hello World!
{% endhighlight %}

> Plus d'infos sur [``std::data()``](/articles/cpp/customization_point_design).

## Paramètres ``auto`` contraints par concepts (C++20)

Lorsque vous concevez **une bibliothèque ou une fonction générique**, vous voulez généralement **éviter d'imposer des types spécifiques à l'appelant** [pour les raisons que nous venons de voir](#stdspanstdbyte-c20).

Au lieu de restreindre vos signatures à [``std::span<T>``](#stdspanstdbyte-c20) (qui ajoute une légère couche d'abstraction), vous pouvez utiliser l'*inférence de type* pour obtenir un code **encore plus générique**.<br>
Cela consiste à **laisser l'appelant proposer son propre type** et à ne l'accepter **que s'il est conforme aux exigences** de la fonction.

Pour cela, il suffit de **déclarer les paramètres de nos fonctions [avec ``auto`` (C++20)](/articles/cpp/auto#abbreviated-function-template-depuis-c20))** (équivalent de templates).

Si le code compile, c'est que **le type fourni par l'appelant dispose des méthodes nécessaires**. Cependant, pour être rigoureux, il est préférable de **contraindre ce type** à l'aide de *concepts* C++20, afin de **n'autoriser explicitement que les types conformes** tout en **documentant clairement nos exigences** pour l'appelant.

Parmi ces concepts, [la bibliothèque *Ranges* (C++20)](https://cppreference.com/cpp/ranges) offre un large choix de contraintes pour les ensembles itérables, comme [``std::ranges::contiguous_range``](https://cppreference.com/cpp/ranges/contiguous_range).

Ainsi, on obtient une **généricité maximale** tout en permettant au compilateur d'**optimiser le code à l'extrême** pour chaque type de conteneur.

{% highlight cpp linenos %}
// La fonction accepte n'importe quelle plage de données contiguës
auto traiterBuffer(std::ranges::contiguous_range auto&& buffer) -> void
{
	// On peut obtenir le pointeur sur la donnée et la taille à l'aide des customization points standards
	auto* data = std::ranges::data(buffer);
	auto size = std::ranges::size(buffer);
	
	// Et itérer sur les éléments sans avoir à en connaitre le type précis
	for (const auto element : buffer)
	{
		// ...
	}
}
{% endhighlight %}

> Si cette idée vous intéresse, je vous invite à passer lire l'article sur **la [programmation générique](/articles/cpp/programmation_generique)** en C++.

## Conclusion et synthèse

La spécialisation ``std::vector<bool>`` est aujourd'hui **universellement reconnue comme une erreur de conception historique du C++**. En tentant de réaliser une **optimisation de performance** prématurée (économiser la mémoire en compactant les bits), **le comité de standardisation a brisé les règles fondamentales du langage**: un conteneur standard **doit** pouvoir [retourner des références ``T&``](https://en.cppreference.com/cpp/container/vector/operator_at) sur ses éléments, ce qui est **matériellement impossible** à l'échelle du bit en C++.

Lorsqu'on s'éloigne de ``std::vector<bool>`` pour **stocker des booléens** ou **manipuler des séquences d'octets**, le C++ moderne propose **plusieurs types et abstractions** selon que vous ayez besoin de **propriété** (ownership), de **performance**, ou de **généricité**.

Voici un **récapitulatif** pour vous aider à choisir l'outil **sémantiquement et techniquement adapté**:

| Type | Propriétaire | Allocation | Taille | Usage cible |
| :--- | :---: | :--- | :---: | :--- |
| **``std::vector<bool>``** | Oui | Heap | Dynamique | [**A éviter**](#spécialisation-du-type-stdvectorbool) |
| **``std::bitset<N>``** | Oui | Stack | Fixe | **Flags** binaires de **taille fixe** |
| **``boost::dynamic_bitset``** | Oui | Heap | Dynamique | **Flags** binaires de taille dynamique (avec Boost) |
| **``std::array<std::byte, N>``** | Oui | Stack | Fixe | **Buffer** de mémoire brute de **taille connue à la compilation** |
| **``std::vector<std::byte>``** | Oui | Heap | Dynamique | **Buffer** de mémoire brute **dynamiquement alloué** |
| **``std::span<std::byte>``** | Non | Stack | Vue | **Passage de buffers** en paramètre **sans copie** |

---

Aller plus loin:
- [Auto](/articles/cpp/auto)
- [Casts](/articles/cpp/casts)
