---
layout: article
title: Les Literals en C++
permalink: articles/c++/literals
category: c++
logo: c++.svg
background: mountains0.jpg
seo:
  title: "Tout sur les Literals en C++"
  description: "Maîtrisez l'initialisation des valeurs en C++: integer, floating-point, string, chrono, complexes et User-defined literals (UDL)."
published: true
---

Les literals, une manière **simple**, **concise** et **lisible** d'initialiser des valeurs.

Si vous avez lu les articles sur [auto](/articles/c++/auto#placeholder-type-specifiers-depuis-c11) et l'[initialisation uniforme](/articles/c++/uniform_initialization), vous trouvez peut-être inutile de devoir préciser le mot clef ``auto`` en plus de déjà préciser le type des variables après le signe égal:

{% highlight cpp %}
unsigned int number = 0; // Le type, le nom de la variable, puis la valeur
auto number = unsigned int{0}; // L'ajout d'auto et d'accolades, pourquoi s'encombrer de ça ?
{% endhighlight %}

Les literals apportent une syntaxe alternative qui répond à cet encombrement du code.

## LiteralType

Un [LiteralType](https://en.cppreference.com/w/cpp/named_req/LiteralType) est un type [``constexpr``](/articles/c++/compile-time_execution) qui peut être construit, manipulé et retourné de manière ``constexpr``.

Ceci n'est qu'un concept théorique, pas un type présent dans le langage. Nous l'utiliserons pour désigner les types pouvant avoir un literal (dans la lib standard, ou [user-defined](#user-defined-literal)).

Un literal est un **préfixe** et/ou un **suffixe** qui s'ajoutent autour d'une valeur pour en **définir le type**.<br>
Dans certains cas, cela peut aussi être un simple mot clef représentant une valeur ([``nullptr``](#pointer-literal-nullptr), [``true``/``false``](#boolean-literal-truefalse)).<br>
[Certains literals](#raw-string-literals) sont particuliers car ils **ne changent pas le type** de la valeur, mais les rendent juste **plus lisibles** dans le code.

Un literal est souvent une [prvalue](/articles/c++/value_categories#prvalue), mais nous allons voir qu'il existe [des exceptions](#string-literal-lvalue-ou-prvalue-).

## Integer literal

Comme vu en introduction, l'écriture de types est parfois très verbeuse.
{% highlight cpp %}
auto number0 = int{0};
auto number1 = unsigned int{0};
auto number2 = unsigned long int{0};
auto number3 = unsigned long long int{0};
{% endhighlight %}

Dans ces écritures, il faut savoir que ``int`` est rendu implicite par d'autres éléments de la ligne. On peut écrire:
{% highlight cpp linenos %}
auto number0 = 0; // Tout nombre entier est par défaut un int
auto number1 = long{0}; // long int
auto number2 = long long{0}; // long long int

auto number3 = unsigned{0}; // unsigned int
auto number4 = unsigned long{0}; // unsigned long int
auto number5 = unsigned long long{0}; // unsigned long long int
{% endhighlight %}

Les literals offrent une écriture encore plus concise:
{% highlight cpp linenos %}
auto number0 = 0; // int
auto number1 = 0l; // long int
auto number2 = 0ll; // long long int (Depuis C++11)

auto number3 = 0u; // unsigned int
auto number4 = 0ul; // unsigned long int
auto number5 = 0ull; // unsigned long long int (Depuis C++11)
{% endhighlight %}

Dans certains cas, des types sont préférables à ceux-ci pour représenter des nombres entiers. Notamment pour représenter des [tailles (std::size_t)](/articles/c++/std_size_t).
Il existe aussi des literals pour ces types:
{% highlight cpp %}
auto number0 = 0uz; // std::size_t
auto number1 = 0z; // La version signée de std::size_t
{% endhighlight %}

Chacun des literals vus jusqu'à présent peut être écrit en majuscule ou en minuscule. Ca **ne change pas leur signification**.<br>
Majuscules et minuscules peuvent également être combinés, **à l'exception du long-long-suffix** dont **les deux 'L' doivent avoir la même casse**.

{% highlight cpp linenos highlight_lines="6 10" %}
auto number0 = 0uL; // OK : unsigned long int
auto number1 = 0Ul; // OK : unsigned long int

auto number2 = 0ll; // OK : long long int
auto number3 = 0LL; // OK : long long int
auto number4 = 0lL; // error

auto number5 = 0Ull; // OK : unsigned long long int
auto number6 = 0uLL; // OK : unsigned long long int
auto number7 = 0ULl; // error

auto number8 = 0uz; // OK : std::size_t
auto number9 = 0uZ; // OK : std::size_t
auto number10 = 0UZ; // OK : std::size_t
{% endhighlight %}

Par souci de lisibilité, on écrit généralement les literals tous en majuscules ou tous en minuscules.

Parmi les literals qui ne servent pas à définir le type d'une valeur, on en trouve trois du côté des integer literals:
{% highlight cpp %}
auto number0 = 0x55ccff; // int exprimé en hexadécimal (Base 16)
auto number1 = 0b001011; // int exprimé en binaire (Base 2) (C++14)
auto number2 = 0123; // int exprimé en octal (Base 8) (commence par 0)
auto number3 = 123'456'789; // int avec des séparateurs (C++14)
{% endhighlight %}

Les apostrophes (``'``) peuvent être placées librement dans le nombre. Elles n'ont **aucun impact** sur la valeur et sont ignorées par le compilateur. Leur seul but est d'améliorer la **lisibilité des grands nombres**.

> [**Attention à l'octal**](#integer-literal): Un nombre commençant par **``0``** est interprété comme de l'**octal** (Base 8).<br>
> C'est un piège classique: ``0123`` en octal vaut **``83`` en décimal** (``1*8² + 2*8¹ + 3*8⁰ = 83``).<br>
> Il suffit d'un seul zéro suivi de n'importe quel chiffre pour déclencher ce comportement.
{: .block-warning }

### Déduction du type sans suffixe

Lorsqu'aucun suffixe n'est fourni, le compilateur choisit le **premier type capable de contenir la valeur** dans une [**liste prédéfinie**](https://en.cppreference.com/w/cpp/language/integer_literal#The_type_of_the_literal).

Cette liste varie selon la base utilisée:

| Base | Liste des types testés (dans l'ordre) |
| :--- | :--- |
| **Décimale** | ``int``, ``long int``, ``long long int`` |
| **Binaire, Octale, Hexadécimale** | ``int``, ``unsigned int``, ``long int``, ``unsigned long int``, ``long long int``, ``unsigned long long int`` |

Cela signifie qu'un literal hexadécimal comme ``0xFFFFFFFF`` peut être déduit comme un **``unsigned int``** sur un système où ``int`` fait 32 bits (car la valeur tient dans 32 bits non signés mais pas signés), alors que sa version décimale équivalente (``4294967295``) sera déduite comme un **``long long int``** (car la base décimale ne teste que les types signés).

### Size literal (C++23)

Le C++23 a introduit des suffixes spécifiques pour faciliter la manipulation des **tailles**:

| Suffixe | Type déduit | Description |
| :--- | :--- | :--- |
| **``uz``** (et variantes) | [**``std::size_t``**](/articles/c++/std_size_t) | Type non signé pour les tailles d'objets. |
| **``z``**, **``Z``** | ``std::make_signed_t<std::size_t>`` | Version signée de ``std::size_t`` (souvent identique à ``std::ptrdiff_t``). |

Pour ``std::size_t``, n'importe quelle combinaison de **``z``** (ou ``Z``) et de **``u``** (ou ``U``) est valide : ``zu``, ``zU``, ``Zu``, ``ZU``, ``uz``, ``uZ``, ``Uz`` ou ``UZ``.

Le type signé produit par **``z``** est l'[**équivalent standard**](/articles/c++/size#les-alternatives-signées--ptrdiff_t-et-stdssize) du type [**``ssize_t`` (POSIX)**](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_types.h.html). Il est très utile pour les boucles décrémentales afin d'éviter les débordements (underflow) des types non signés.

En revanche, il n'existe toujours pas de literal pour les types à **largeur fixe** stricte (comme ``std::int64_t`` ou ``std::int32_t``). On continue d'utiliser les literals des types fondamentaux correspondants:
{% highlight cpp %}
auto n64 = 42ll; // Type long long int (au moins 64 bits)
auto u64 = 42ull; // Type unsigned long long int (au moins 64 bits)
{% endhighlight %}


> Pour comprendre **comment la taille de ces types varie selon votre architecture**, consultez **l'article sur les [types fondamentaux](/articles/c++/fundamental_types)**.

## Floating-point literal

Les nombres à virgule flottante ont leur propre literals, qui diffère en fonction du type souhaité.

{% highlight cpp %}
auto number0 = double{0};
auto number1 = float{0};
{% endhighlight %}

{% highlight cpp %}
auto number0 = 0.0; // double
auto number1 = 0.0f; // float
{% endhighlight %}

Le zéro avant le point est facultatif, tout comme le zéro après le point:
{% highlight cpp %}
auto number0 = .0; // double
auto number1 = 1.; // double (équivalent à 1.0)
auto number2 = 1.f; // float
{% endhighlight %}

### Notation scientifique

On peut exprimer des puissances de 10 avec le suffixe ``e`` ou ``E`` (exposant):
{% highlight cpp %}
auto number0 = 1e3; // 1 * 10^3 = 1000.0 (double)
auto number1 = 1.5e-2; // 1.5 * 10^-2 = 0.015 (double)
auto number2 = 1.0E2f; // 1.0 * 10^2 = 100.0 (float)
{% endhighlight %}

### Hexadécimaux à virgule flottante (C++17)

Depuis C++17, on peut écrire des [**nombres à virgule flottante en hexadécimal**](https://en.cppreference.com/w/cpp/language/floating_literal#Hexadecimal_floating_literals). L'exposant est **obligatoire** et utilise la lettre ``p`` ou ``P`` (exposant en **puissance de 2**):
{% highlight cpp %}
auto number0 = 0x1.fp3; // 1.9375 * 2^3 = 15.5 (double)
auto number1 = 0x1p-2; // 1.0 * 2^-2 = 0.25 (double)
auto number2 = 0x1.Ap0; // 1.625 * 2^0 = 1.625 (double)
{% endhighlight %}

> **Calcul hexadécimal**: Pour ``0x1.A``, le chiffre ``1`` vaut 1 et le chiffre ``A`` après la virgule vaut 10/16 = 0,625, d'où le résultat de 1,625. L'exposant ``p0`` (2^0 = 1) ne change pas la valeur.

### Types flottants à largeur fixe (C++23)

C++23 introduit des suffixes pour les [**nombres à virgule flottante à largeur fixe**](https://en.cppreference.com/w/cpp/language/floating_literal#The_type_of_the_literal). À noter qu'**aucun équivalent n'existe pour les entiers**, pour lesquels on utilise toujours les suffixes fondamentaux ([**``ll``, ``ull``**](#integer-literal)).

| Suffixe | Type déduit |
| :--- | :--- |
| **``f16``**, **``F16``** | ``std::float16_t`` |
| **``f32``**, **``F32``** | ``std::float32_t`` |
| **``f64``**, **``F64``** | ``std::float64_t`` |
| **``f128``**, **``F128``** | ``std::float128_t`` |
| **``bf16``**, **``BF16``** | ``std::bfloat16_t`` |

Tout comme les autres suffixes vus jusqu'à présent, la **casse n'a pas d'importance** (ex: ``bf16`` est identique à ``BF16``).

{% highlight cpp %}
auto f16Value = 1.0f16;
auto bf16Value = 1.0bf16;
{% endhighlight %}

## Pointer literal: ``nullptr``

Faisons un petit détour dans l'historique du langage C pour comprendre les enjeux autour du literal ``nullptr`` en C++.

### En C (avant C23): ``NULL``

En langage C, ``NULL`` est une macro dont la valeur dépend de l'implémentation.

Cette macro peut valoir **[``(void*)0``](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/stddef.h.html)** (Le nombre 0 casté en ``void*``), ou simplement le nombre [``0``](https://en.cppreference.com/w/c/types/NULL).

Elle est utilisée pour représenter tout pointeur **ne pointant sur rien**.

Par exemple **pour initialiser un pointeur** dans l'intention de lui attribuer une adresse plus tard:
{% highlight c %}
void* pointer = NULL;
{% endhighlight %}

Ou **pour signifier un pointeur invalide** retourné par une fonction en cas d'erreur:
{% highlight c linenos highlight_lines="4" %}
void* allocString(size_t length)
{
	if (length == 0) // Gestion d'erreur
		return NULL;

	return calloc(length + 1, sizeof(char));
}
{% endhighlight %}


Ou également très utilisée en tant que **[valeur sentinelle](https://fr.wikipedia.org/wiki/Valeur_sentinelle)** dans les **listes chaînées** et certains tableaux **pour marquer la fin des éléments listés**.
{% highlight c linenos highlight_lines="9" %}
typedef struct s_node {
	struct s_node* next;
} Node;

size_t getLength(const Node* head)
{
	size_t length = 0;
	const Node* current = head;
	while (current != NULL)
	{
		++length;
		current = current->next;
	}
	return length;
}
{% endhighlight %}

Etant une macro, sa valeur est simplement copiée par le préprocesseur à l'endroit de chaque utilisation de ``NULL``.

Ce qui est problématique car cette valeur n'étant pas typée, ça autorise son usage dans des contextes inappropriés mais néanmoins valides fonctionnellement parlant:
{% highlight c %}
int number = NULL;
{% endhighlight %}

De plus, l'absence de typage permet de caster cette valeur en ce qu'on veut.
{% highlight c %}
char sentinelChar = (char)NULL; // '\0' serait plus approprié
{% endhighlight %}

### En C (Depuis C23): ``nullptr``

Pour résoudre ces problèmes et restreindre ``NULL`` aux usages appropriés, la valeur ``nullptr`` a été créée.

Ce n'est [pas une macro](https://en.cppreference.com/w/c/language/nullptr) mais une [non-lvalue](https://en.cppreference.com/w/c/language/value_category#Non-lvalue_object_expressions) fortement typée pour n'être convertible que vers un type de pointeur ou vers ``bool`` (pour tester dans une condition si le pointeur est valide. Cas dans lequel ce cast en [``bool``]() résulte en la valeur [``false``](#en-c-depuis-c23-truefalse)).

Son type est [``nullptr_t``](https://en.cppreference.com/w/c/types/nullptr_t), un type défini spécialement pour ``nullptr``, et par rapport à la valeur ``nullptr``:
{% highlight c %}
typedef typeof(nullptr) nullptr_t;
{% endhighlight %}
L'oeuf ou la poule? Cette définition répond à la question.

Ce type ne peut avoir aucune autre valeur que ``nullptr``, qui peut être utilisée comme si sa valeur était ``(void*)0`` mais avec les contraintes d'utilisation cités ci-dessus.

La taille mémoire occupée par ``nullptr_t`` est égale à celle occupée par un ``void*`` ([``sizeof(nullptr_t) == sizeof(void*) && alignof(nullptr_t) == alignof(void*)``](https://en.cppreference.com/w/c/types/nullptr_t)).
C'est ce qu'il faut pour pouvoir stocker n'importe quelle adresse mémoire sans contrainte de taille.

### En C++

Bien qu'utilisable en C++, la macro ``NULL`` pourrait être utilisée mais est une très mauvaise pratique comme nous venons de le voir.

En C++, la macro ``NULL`` est définie comme valant ``#define NULL 0`` jusqu'en C++11.
Elle reste présente [dans les includes de headers C portés en C++](https://en.cppreference.com/w/cpp/types/NULL).

Le **C++11** se voit ajouter le **literal ``nullptr``** (oui, c'est bien un literal et pas une constante comme [``nullptr`` en C](#en-c-depuis-c23-nullptr)), version à partir de laquelle ``NULL`` est **redéfini en ``#define NULL nullptr``** pour bénéficier tout de même du **typage fort** sur les codes historiques.

> Bien que ``nullptr`` en C++11 et ``nullptr`` en C23  **partagent le même nom** et remplissent un rôle similaire (valeur nulle non ambiguë), ce sont deux entités distinctes, **chacune définie dans son langage respectif** avec des mécanismes internes différents.<br>
>
> Il en est de même pour ``std::nullptr_t`` en C++11 et ``nullptr_t`` en C23. Le premier étant un type propre au langage C++ **importé depuis ``<cstddef>``** tandis que le second est un **type fondamental** du langage C.<br>
>
> Ils représentent la même notion et partagent des comportements similaires, **mais ne sont ni la même valeur, ni le même type partagé entre les deux langages**.<br>
> Une **interopérabilité** reste cependant **possible, mais pas automatique**.<br>
> Ceci requiert l'utilisation de ``extern "C"``.
{: .block-warning }

Etant un literal, ``nullptr`` en C++11 est une [prvalue](/articles/c++/value_categories#prvalue).

Le type ``std::nullptr_t`` est [défini comme étant ``using nullptr_t = decltype(nullptr);`` (C++11)](https://en.cppreference.com/w/cpp/language/types#std::nullptr_t) ([Source 2](https://en.cppreference.com/w/cpp/types/nullptr_t)).

{% highlight cpp %}
auto* pointer = nullptr; // error: variable 'pointer' with type 'auto *' has incompatible initializer of type 'std::nullptr_t'
auto pointer = nullptr; // Variable de type std::nullptr_t
void* pointer = nullptr; // Variable de type void*
char* pointer = nullptr; // Variable de type char*
{% endhighlight %}



En utilisant une valeur fortement typée, on évite les conversions implicites et les utilisations incohérentes de cette valeur.

## Boolean literal: ``true``/``false``

### En C (avant C23)

Avant C99, le langage C ne disposait pas de type natif pour représenter un booléen. Les programmeurs utilisaient l'entier ``int`` avec les valeurs ``0`` (false) et ``1`` (true).

À partir de C99, le header ``<stdbool.h>`` a introduit :
- Le type [**``_Bool``**](https://en.cppreference.com/w/c/keyword/_Bool) : un type entier spécial qui, [selon le standard C](https://en.cppreference.com/w/c/language/arithmetic_types#Boolean_type), ne peut stocker que les valeurs **``0``** ou **``1``**. Toute valeur non-nulle qui lui est assignée subit une **conversion implicite** vers la valeur **``1``**.
- La macro **``bool``** ([un simple alias vers ``_Bool``](https://en.cppreference.com/w/c/header/stdbool.html))
- Les macros [**``true``** et **``false``**](https://en.cppreference.com/w/c/header/stdbool.html) qui valent littéralement **``1``** et **``0``** (de type **``int``**).

Dans ce contexte, ``true`` et ``false`` sont donc techniquement des **entiers**.

> **Confusion fréquente**: On trouve parfois de vieilles documentations suggérant que ``bool`` est un simple ``#define`` vers ``unsigned int``. C'était une pratique courante pour "bricoler" des booléens avant la norme C99, mais c'est aujourd'hui **obsolète et incorrect** par rapport aux standards modernes.
{: .block-warning }

### En C (depuis C23)

À partir de C23, [le langage C a intégré ``bool``, ``true`` et ``false`` comme des **mots-clefs** natifs](https://en.cppreference.com/w/c/keyword/bool).

Désormais, [``true`` et ``false``](https://en.cppreference.com/w/c/language/bool_constant.html) ont le type **``bool``**. Cependant, pour conserver la compatibilité avec le code historique, ils subissent une **promotion entière** automatique vers ``1`` et ``0`` (de type ``int``) dès qu'ils sont utilisés dans une expression arithmétique.

### En C++

En C++, ``bool`` est un **type fondamental** (distinct des entiers) et ``true``/``false`` sont des [**literals** de type ``bool``](https://en.cppreference.com/w/cpp/language/bool_literal.html).

Cette distinction est ce qui rend possible la **surcharge de fonctions** (overloading) en C++, fonctionnalité inexistante en C:
{% highlight cpp %}
void print(int n);  // Fonction 1
void print(bool b); // Fonction 2

print(true); // Appelle la Fonction 2. Si bool était un alias de int, ce code ne compilerait pas (redéfinition).
{% endhighlight %}

En C++, le type natif **``bool``** occupe **généralement 1 octet** (8 bits). Le standard ne garantit pas cette taille exacte (elle est définie par l'implémentation), mais elle est choisie par les compilateurs pour être la plus petite unité adressable de la machine.

{% highlight cpp %}
bool b0 = true;
bool b1 = false;
{% endhighlight %}

Contrairement aux anciennes macros du langage C, ``true`` **ne vaut pas** ``1`` et ``false`` **ne vaut pas** ``0``. [``1`` et ``0`` sont des ``int``](#integer-literal).<br>

Les conditions prennent toujours un booléen:
{% highlight cpp %}
if (true)
{}
{% endhighlight %}

A noter que, lorsqu'on écrit une valeur non booléenne dans une condition, [celle-ci est implicitement convertie en valeur booléenne](https://en.cppreference.com/w/cpp/language/implicit_conversion#Boolean_conversions). Les valeurs zéro, la valeur [``nullptr``](#pointer-literal-nullptr) et les pointeurs nuls sont converties en ``false``, tandis que toute autre valeur est convertie en ``true``.

{% highlight cpp %}
if (42) // 42 est implicitement converti en true
{}
{% endhighlight %}

## Character literal

Un literal de caractère est entouré de guillemets simples (``'``). [Le type et l'encodage **dépendent du préfixe** utilisé](https://en.cppreference.com/w/cpp/language/character_literal):

{% highlight cpp %}
auto c0 = 'c'; // char
auto c1 = u8'c'; // char8_t (UTF-8) (Depuis C++17) (char jusqu'en C++20, char8_t à partir de C++20)
auto c2 = u'c'; // char16_t (UTF-16) (Depuis C++11)
auto c3 = U'c'; // char32_t (UTF-32) (Depuis C++11)
auto c4 = L'c'; // wchar_t (Wide character)
{% endhighlight %}

> **Évolutions importantes** :
> - **C++20** : ``u8'c'`` passe du type ``char`` au type [**``char8_t``**](/articles/c++/fundamental_types#le-cas-de-char8_t-c20).
> - **C++23** : Le standard définit désormais que les littéraux préfixés **``u8``**, **``u``** et **``U``** sont encodés respectivement en **UTF-8**, **UTF-16** et **UTF-32** ([**P2314R2**](https://wg21.link/p2314r2)). Cette clarification lève les ambiguïtés historiques sur leur encodage, tandis que l'[**execution character set**](https://en.cppreference.com/w/cpp/language/charset.html#Execution_character_set) reste distinct et peut dépendre de l'environnement.

### Caractères d'échappement

Certains caractères spéciaux ne peuvent pas être écrits tels quels dans le code source (soit parce qu'ils sont **invisibles**, soit parce qu'ils entreraient en **conflit avec la syntaxe du langage** comme les guillemets). On doit alors les "**échapper**" avec un **antislash**/**backslash** (``\``).

Ces séquences sont utilisables aussi bien dans les [**character literal**](#character-literal) (``'``) que dans les [**string literal**](#string-literal) (``"``).

> Notez qu'il n'est pas nécessaire d'échapper un double guillemet à l'intérieur de guillemets simples (``'"'`` est valide), ni un guillemet simple à l'intérieur de guillemets doubles (``"'"`` est valide). L'échappement n'est requis que pour lever une ambiguïté.

Voici la liste des [**séquences d'échappement simples**](https://en.cppreference.com/w/cpp/language/escape):

| Séquence | Signification |
| :--- | :--- |
| ``\n`` | Saut de ligne (newline) |
| ``\r`` | Retour chariot (carriage return) |
| ``\t`` | Tabulation horizontale |
| ``\v`` | Tabulation verticale |
| ``\b`` | Retour arrière (backspace) |
| ``\f`` | Saut de page (form feed) |
| ``\a`` | Signal sonore (alert/bell) |
| ``\\`` | Antislash |
| ``\'`` | Guillemet simple |
| ``\"`` | Guillemet double |
| ``\?`` | Point d'interrogation |
| ``\0`` | Caractère nul utilisé comme **sentinelle** (valant **0**, équivalent à [**``NULL``**](#en-c-avant-c23-null) en langage C) |

> **Note sur le signal sonore (``\a``)**: L'émission d'un son dépend de votre terminal et de sa configuration. Le caractère est envoyé au flux de sortie, mais c'est à l'émulateur de terminal de décider s'il doit déclencher un "beep" système ou une notification.

#### Codes numériques et Unicode

Les [**universal character names**](https://en.cppreference.com/w/cpp/language/escape) (tableau ci-dessous) permettent de référencer un caractère par son [*code point*](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-2/#G25564) Unicode. Ils **évitent toute dépendance** à l'**encodage du fichier** source.

Sans ces codes, un caractère écrit "**en dur**" peut être **interprété différemment selon la machine** qui compile:
{% highlight cpp %}
// Le résultat dépend de l'encodage du fichier source
auto s = "é";
// Si le fichier source est en UTF-8 → C3 A9
// Si le fichier source est en Windows-1252 → E9

// Avec un universal character name
auto s = "\u00E9"; // garantit de référencer le code point Unicode U+00E9
{% endhighlight %}

En revanche, **l'encodage final** du caractère dans le binaire **dépend du type de literal** ("", [u8""](#string-literal), [u""](#string-literal), [U""](#string-literal)).<br>
Seuls **les literals UTF** (u8, u, U) **garantissent l'encodage** exact des octets générés.

| Séquence | Signification |
| :--- | :--- |
| ``\nnn`` | Valeur **octale** (1 à 3 chiffres, ex: ``\123``) |
| ``\xn...`` | Valeur **hexadécimale**. ``\x`` suivi d'un **nombre arbitraire de chiffres** hexadécimaux (ex: ``\x53``), **jusqu'à un caractère non-hexadécimal** |
| ``\unnnn`` | Code **Unicode**. ``\u`` suivi de **4 chiffres** hexadécimaux |
| ``\Unnnnnnnn`` | Code **Unicode**. ``\U`` suivi de **8 chiffres** hexadécimaux |
| ``\o{n...}`` | **Octal délimité**¹ (C++23) |
| ``\x{n...}`` | **Hexadécimal délimité**¹ (C++23) |
| ``\u{n...}`` | **Unicode délimité**¹ (C++23) exprimé en hexadécimal |
| ``\N{NAME}`` | **Caractère nommé** (C++23). Permet d'utiliser un caractère par son nom officiel Unicode. |

*¹Le terme "**délimité**" signifie que la valeur est **entourée d'accolades**. Celles-ci peuvent contenir un **nombre arbitraire de chiffres**. Cette syntaxe permet une longueur libre et **évite que le compilateur ne "mange" par erreur des chiffres** appartenant au texte qui suit.*

{% highlight cpp %}
auto s0 = "\123"; // 'S' (Octal)
auto s1 = "\x53"; // 'S' (Hexadécimal)

auto s2 = "\u{1F600}"; // 😀 (Unicode délimité)
auto s3 = "\x{41}"; // 'A' (Hexadécimal délimité)

auto s4 = "\N{GREEK DELTA}"; // Δ
auto s5 = "\N{GRINNING FACE}"; // 😀
{% endhighlight %}

### Multi-caractères (Multi-character literal)

Mettre plusieurs caractères entre guillemets simples est une pratique **fortement déconseillée**:
{% highlight cpp %}
auto mc = 'AB'; // Type int, comportement défini par l'implémentation
{% endhighlight %}

Cette fonctionnalité, [**héritée du langage B**](https://en.cppreference.com/w/cpp/language/character_literal#Notes) (l'ancêtre du C), n'est pas spécifiée formellement par le standard C++.<br>
Cependant, la plupart des compilateurs (sauf MSVC) l'implémentent **en remplissant les octets d'un entier dans l'ordre [big-endian](https://fr.wikipedia.org/wiki/Endianness)**.
Ainsi, ``'ABCD'`` résultera souvent en la valeur hexadécimale ``0x41424344`` (où ``0x41`` est le code ASCII de 'A', ``0x42`` celui de 'B', etc).

> **Différence majeure entre C et C++**:
> - En **C**, un character literal (``'a'``) a le type [**``int``**](https://en.cppreference.com/w/c/language/character_constant).
> - En **C++**, il a le type [**``char``**](https://en.cppreference.com/w/cpp/language/character_literal).

> **Changement C++23** : Jusqu'en C++20, les littéraux multi-caractères étaient autorisés avec des préfixes (ex: ``L'AB'``). Depuis le **C++23**, ces formes préfixées sont **interdites** (erreur de compilation). Seul le littéral simple ``'AB'`` (sans préfixe) reste autorisé pour des raisons historiques, avec un comportement qui reste [**défini par l'implémentation**](https://en.cppreference.com/w/cpp/language/character_literal#Multicharacter_literal).
{: .block-warning }

## String literal

Un literal de chaîne de caractères est entouré de guillemets doubles (``"``). Tout comme les [**caractères**](#character-literal), le préfixe définit le type des éléments de la chaîne:

{% highlight cpp %}
auto s0 = "hello"; // const char[6]
auto s1 = u8"hello"; // const char8_t[6] (UTF-8) (Depuis C++20)
auto s2 = u"hello"; // const char16_t[6] (UTF-16) (Depuis C++11)
auto s3 = U"hello"; // const char32_t[6] (UTF-32) (Depuis C++11)
auto s4 = L"hello"; // const wchar_t[6] (Wide character)
{% endhighlight %}

Chaque literal de chaîne, quel que soit son encodage, se termine par une **sentinelle nulle** (``\0``) ajoutée automatiquement par le compilateur. La taille du tableau (``[6]`` ici) inclut toujours ce caractère invisible.

### ``std::string`` literal (C++14) et ``std::string_view`` literal (C++17)

En plus des tableaux de caractères classiques, le C++ moderne permet de créer directement des objets de haut niveau en ajoutant un suffixe à la chaîne:

{% highlight cpp %}
void process()
{
	using namespace std::literals; // Active les suffixes standard
	auto s = "hello"s; // std::string (Depuis C++14)
	auto sv = "hello"sv; // std::string_view (Depuis C++17)
}
{% endhighlight %}

Pour que ces suffixes soient reconnus, vous devez écrire un **``using namespace``**. Bien que cette pratique soit généralement déconseillée car elle [**pollue le namespace**](/articles/c++/scopes#using-namespace) dans lequel elle se trouve, elle est ici **recommandée et acceptée** car elle constitue la **seule manière** de conserver l'intérêt esthétique et la concision des literals.

Une alternative plus granulaire consiste à utiliser une déclaration **``using``** sur un opérateur spécifique (ex: ``using std::literals::string_view_literals::operator""sv;``), mais cela devient vite fastidieux si vous utilisez plusieurs types de literals.

{% highlight cpp %}
void process()
{
	using std::literals::string_view_literals::operator""sv;
	auto sv = "hello"sv; 
}
{% endhighlight %}

Il est techniquement possible d'expliciter le namespace complet à chaque utilisation, mais cette syntaxe est si verbeuse qu'elle fait **perdre tout intérêt** aux literals par rapport à un constructeur classique (``std::string{"hello"}``).

{% highlight cpp %}
void process()
{
	auto s = std::literals::string_literals::operator""s("hello", 5); 
	auto sv = std::literals::string_view_literals::operator""sv("hello", 5); 
}
{% endhighlight %}

> **Bonne pratique** : Pour limiter la pollution, veillez à placer le ``using namespace std::literals;`` dans le **scope le plus restreint possible** (à l'intérieur d'une fonction ou d'un bloc) comme dans l'exemple ci-dessus.

Vous pouvez choisir d'activer tous les literals ou seulement certains:
- ``using namespace std::literals;`` (Active **tous** les literals de la bibliothèque standard: [**string**](#stdstring-literal-c14-et-stdstring_view-literal-c17), [**chrono**](#chrono-literal-c14--c20) et [**complex**](#complex-literals-c14))
- ``using namespace std::string_literals;`` (Active uniquement [**``""s``**](https://en.cppreference.com/w/cpp/string/basic_string/operator%22%22s))
- ``using namespace std::string_view_literals;`` (Active uniquement [**``""sv``**](https://en.cppreference.com/w/cpp/string/basic_string_view/operator%22%22sv))

### Combinaison des préfixes et suffixes

Les préfixes d'encodage peuvent se combiner avec les suffixes de type pour produire toutes les variantes de chaînes de la bibliothèque standard:

| Préfixe | Suffixe [**``s``**](#stdstring-literal-c14-et-stdstring_view-literal-c17) (C++14) | Suffixe [**``sv``**](#stdstring-literal-c14-et-stdstring_view-literal-c17) (C++17) |
| :--- | :--- | :--- |
| *(aucun)* | ``std::string`` | ``std::string_view`` |
| [**``u8``**](#string-literal) | ``std::u8string`` (C++20) | ``std::u8string_view`` (C++20) |
| [**``u``**](#string-literal) | ``std::u16string`` | ``std::u16string_view`` |
| [**``U``**](#string-literal) | ``std::u32string`` | ``std::u32string_view`` |
| [**``L``**](#string-literal) | ``std::wstring`` | ``std::wstring_view`` |

{% highlight cpp %}
using namespace std::literals;

auto s = u8"hello"s; // std::u8string
auto sv = u"hello"sv; // std::u16string_view
{% endhighlight %}

> À noter que la plupart de ces littéraux sont devenus [**``constexpr``**](/articles/c++/compile-time_execution) à partir du C++20.

Par nature, un ``std::string_view`` ne garantit pas la présence d'un ``\0`` final (il se contente d'un pointeur et d'une taille). Cependant, lorsqu'il est construit à partir d'un **literal** (``"..."sv``), il pointe vers le tableau statique du binaire qui, lui, possède bien cette sentinelle. Passer ``sv.data()`` à une fonction attendant un pointeur C est donc **techniquement sûr** dans ce cas précis, bien que risqué conceptuellement.

### String literal: lvalue ou prvalue ?

Prenons *un string literal* comme ``"hello"``, utilisé tel quel dans un code **sans être stocké dans une variable**. **Est-ce une prvalue ou une lvalue ?**

Un *literal* étant une valeur **temporaire** dans la majorité des cas, dont la persistance en RAM est limitée à son scope d'utilisation, on pourrait penser avoir affaire ici à une **prvalue**.

Le cas des chaînes de caractères est un peu particulier. Pour des raisons de performances, sa persistance en RAM **n'est pas limitée à son scope d'utilisation**.

Lors de la compilation en assembleur, les chaînes de caractères préservées pendant la compilation sont stockés dans [la section ``.rodata`` ("read-only data")](https://en.wikipedia.org/wiki/Data_segment) du code assembleur.

Elles ont donc leur adresse propre en RAM pendant toute l'exécution du programme.<br>
On peut le vérifier avec:
{% highlight cpp %}
std::cout << &"hello"; // Affiche l'adresse en RAM de la chaîne "hello"
{% endhighlight %}

Ces literaux sont bien sûr constants. A la fois leurs caractères le sont, mais également leur adresse et leur taille.

Tenter de modifier un *literal* est un *UB*:
{% highlight cpp %}
const char* constString = "hello";
char* string = const_cast<char*>(constString);
string[1] = 'a'; // Undefined behavior
{% endhighlight %}

Une chaîne comme ``"hello"`` aura le type ``const char[6]`` (et non ``const char*``). ``6`` étant le nombre de caractères de la chaîne (5) auquel on ajoute 1 pour la valeur sentinelle ``'\0'``.

Pour récapituler, un *string literal*:
- a une adresse en RAM
- n'est pas un temporaire mais est persistant en mémoire

**Un string literal est donc une lvalue, et non une prvalue**.

## Raw string literal (C++11)

Les [**raw string literals**](https://en.cppreference.com/w/cpp/language/string_literal.html#Raw_string_literals) permettent d'écrire des chaînes sans avoir à échapper les [**caractères spéciaux**](#caractères-déchappement) (comme ``\`` ou ``"``).
 Ils sont également le seul moyen naturel d'inclure des **retours à la ligne** directement dans le code source:

{% highlight cpp %}
// Sans raw string literal (via \n)
auto text = "Ligne 1\nLigne 2\nLigne 3";

// Sans raw string literal (via échappement de fin de ligne \)
auto text = "Ligne 1\
Ligne 2\
Ligne 3";

// Avec raw string literal
auto text = R"(Ligne 1
Ligne 2
Ligne 3)";
{% endhighlight %}

### Délimiteurs personnalisés

Un problème survient si votre texte contient lui-même la séquence de fermeture par défaut ``)"`` (par exemple, si vous stockez du code C++ ou une expression régulière complexe). Le compilateur s'arrêterait prématurément au premier ``)"`` rencontré.

Pour résoudre ce conflit, on peut placer n'importe quelle chaîne de caractères comme **délimiteur** entre le ``R"`` et la parenthèse ouvrante. Cette chaîne doit être répétée à la fin:

{% highlight cpp %}
auto code = R"cpp(std::println("Hello )" World");)cpp";
{% endhighlight %}

**Contraintes sur le délimiteur**: Un délimiteur peut contenir n'importe quel caractère sauf les **espaces**, les **parenthèses** (ouvrantes ou fermantes), les **antislashs** (``\``) et les **caractères de contrôle** (comme le retour à la ligne). Sa longueur maximale est de 16 caractères ([**voir le standard**](https://en.cppreference.com/w/cpp/language/string_literal#Raw_string_literals)).

> Les raw strings sont combinables avec les préfixes d'encodage (``u8R"(...)"``) et les suffixes de type (``R"(...)"sv``).

## Chrono literal (C++14 / C++20)

Les [**literals de la bibliothèque ``<chrono>``**](https://en.cppreference.com/w/cpp/symbol_index/chrono_literals) permettent de représenter des **durées** et des **dates** de manière lisible. 
Ces literals sont activés par ``using namespace std::literals;``. Si vous souhaitez être plus sélectif, vous pouvez utiliser un namespace spécifique:

{% highlight cpp %}
using namespace std::literals;
// ou
using namespace std::chrono_literals;
// ou
using namespace std::literals::chrono_literals;
{% endhighlight %}

> **Pourquoi ça fonctionne ?** La bibliothèque standard définit ces opérateurs dans des [**inline namespaces**](/articles/c++/scopes#inline-namespace) imbriqués. Ainsi, ``std::chrono_literals`` est techniquement un alias de ``std::literals::chrono_literals``, et les deux sont automatiquement "remontés" dans ``std::literals``.

{% highlight cpp %}
using namespace std::chrono_literals;

// Durées (C++14)
auto h = 10h;    // std::chrono::hours
auto m = 30min;  // std::chrono::minutes
auto s = 15s;    // std::chrono::seconds
auto ms = 250ms; // std::chrono::milliseconds
auto us = 100us; // std::chrono::microseconds
auto ns = 50ns;  // std::chrono::nanoseconds

// Dates (C++20)
auto y = 2024y;  // std::chrono::year
auto d = 15d;    // std::chrono::day
{% endhighlight %}

> **Note sur l'exhaustivité**: Seuls l'année (``y``) et le jour (``d``) possèdent des literals. Les mois ([**``January``, ``February``, etc**](https://en.cppreference.com/w/cpp/chrono/month)) ainsi que les jours de la semaine ([**``Monday``, ``Tuesday``, etc**](https://en.cppreference.com/w/cpp/chrono/weekday)) ne sont pas des literals mais des **constantes typées** fournies par la bibliothèque standard. Il n'existe aucun literal ni constante standard pour les **semaines** ou les **trimestres**.

## Complex literal (C++14)

Les literals complexes permettent d'initialiser des **nombres complexes** (``std::complex``). Ils sont accessibles via trois namespaces équivalents grâce au mécanisme des [inline namespaces](/articles/c++/scopes#inline-namespace):

{% highlight cpp %}
using namespace std::literals;
// ou
using namespace std::complex_literals;
// ou
using namespace std::literals::complex_literals;
{% endhighlight %}

Un nombre complexe est composé d'une **partie réelle** et d'une **partie imaginaire**.<br>
Le literal ``i`` (ou ``if``, ou ``il``) **ne crée que la partie imaginaire**.

{% highlight cpp %}
using namespace std::complex_literals;

auto z0 = 1 + 2i; // std::complex<double> : Partie réelle 1.0, imaginaire 2.0
auto z1 = 1.0if;  // std::complex<float>  : Partie réelle 0.0, imaginaire 1.0
auto z2 = 1.0il;  // std::complex<long double>
{% endhighlight %}

## User-defined literal (Depuis C++11)

Le langage permet aux développeurs de **définir leurs propres suffixes** pour créer des **literals personnalisés**. On parle de [**User-defined literals (UDL)**](https://en.cppreference.com/w/cpp/language/user_literal). Ils sont généralement conçus pour produire des [**LiteralTypes**](#literaltype), mais [**ne sont pas obligés de retourner une valeur**](#effets-de-bord).

Pour définir un literal, on utilise la syntaxe suivante:
{% highlight cpp %}
Type operator ""_suffix(parameter);
{% endhighlight %}

> **Note sur la syntaxe**: L'espace entre les guillemets et l'identifiant (``operator "" _suffix``) était obligatoire en C++11. Cependant, cette écriture est désormais [**obsolète (deprecated)**](https://en.cppreference.com/w/cpp/language/user_literal#Literal_operators) car elle **peut entrer en conflit** avec des [**identifiants réservés**](https://en.cppreference.com/w/cpp/language/identifiers#Reserved_identifiers) (comme ceux commençant par un underscore suivi d'une majuscule, ex: [**``_Z``**](https://en.wikipedia.org/wiki/Name_mangling#C++)) (utilisé pour le [**mangling**](/articles/c++/scopes#name-mangling) dans l'écosystème GCC/Clang (ABI Itanium)).<br>
> Il est donc vivement recommandé de coller le suffixe aux guillemets (``operator ""_suffix``) pour garantir la portabilité du code.

### Règle de l'underscore

Le standard impose que tous les literals définis par l'utilisateur commencent par un **underscore** (``_``). Les suffixes sans underscore sont réservés à la bibliothèque standard (comme ``s``, ``sv``, ``h``, etc).

### Types de paramètres autorisés

Les opérateurs de literals ne peuvent prendre [**que des types spécifiques**](https://en.cppreference.com/w/cpp/language/user_literal#Literal_operators) en paramètre:

- **Nombres ([numeric literal operator](#numeric-literal-operator-vs-raw-literal-operator))** : ``unsigned long long int`` (entiers) ou ``long double`` (flottants).
- **Nombres ([raw literal operator](#numeric-literal-operator-vs-raw-literal-operator))**: Un simple ``const char*`` (reçoit la chaîne brute du nombre).
- **Caractères** : ``char``, ``wchar_t``, ``char8_t`` (C++20), ``char16_t``, ``char32_t``.
- **Chaînes** : Un couple ``(const T*, std::size_t)`` où ``T`` est l'un des types de caractères ci-dessus.

> **Conflits de suffixes**: Il est possible d'utiliser le même suffixe pour des catégories différentes (ex: le suffixe ``s`` utilisé pour les [**chaînes**](#stdstring-literal-c14-et-stdstring_view-literal-c17) (``"hello"s``) et pour [**chrono**](#chrono-literal-c14--c20) (``1s``)). Le compilateur ne rencontre aucune ambiguïté car il distingue les catégories par leurs paramètres (un couple ``ptr, size`` pour une chaîne contre un ``unsigned long long`` pour un nombre).

> **Le cas particulier du ``const char*``**: Un opérateur ne prenant qu'un simple ``const char*`` est utilisé **uniquement** pour les literals numériques en mode "Raw". Il n'existe pas d'équivalent pour les chaînes de caractères (**qui exigent toujours la taille en second paramètre**).
>
> Ainsi, si vous définissez un ``operator ""_suffix(const char*)``:
> - ``123_suffix``: **Succès**, l'opérateur est appelé avec la chaîne ``"123"``.
> - ``"abc"_suffix``: **Erreur**, car aucune surcharge ne correspond (il manque le paramètre ``std::size_t``).

{% highlight cpp linenos %}
struct Distance { long double meters; };

// Définition d'un literal pour les kilomètres
constexpr Distance operator ""_km(long double distance)
{
    return Distance{ distance * 1000 };
}

auto distance = 1.5_km; // Distance{ 1500.0 }
{% endhighlight %}

### Effets de bord

Bien qu'un literal serve généralement à produire une valeur, un opérateur de literal reste une fonction. **Il peut donc retourner ``void``** et être utilisé uniquement pour ses effets de bord (affichage, logging, etc.).

{% highlight cpp %}
void operator ""_print(const char* str, std::size_t)
{
    std::println("{}", str);
}

void process()
{
    "Hello World!"_print; // Affiche "Hello World!"
}
{% endhighlight %}

### Numeric literal operator vs Raw literal operator

Pour les littéraux numériques (entiers et flottants), il existe [**deux manières** de recevoir la valeur](https://en.cppreference.com/w/cpp/language/user_literal#Literal_operators):

1.  **Numeric literal operator** (souvent appelé **Cooked**): Le compilateur a déjà "digéré" la valeur pour vous en la convertissant en un type fondamental (``unsigned long long int`` ou ``long double``). C'est la forme la plus simple à utiliser pour des nombres.
2.  **Raw literal operator** (souvent appelé **Raw**): Le compilateur vous passe la chaîne de caractères brute (``const char*``) telle qu'elle est écrite dans le code source. C'est plus complexe à gérer mais indispensable pour manipuler des nombres de taille arbitraire dépassant les capacités des types standards.

> **Priorité** : Si vous définissez à la fois un **numeric literal operator** et un **raw literal operator** pour un même suffixe numérique, c'est la version typée (le *numeric literal operator*) qui sera privilégiée.

{% highlight cpp %}
void operator ""_print(const char* rawString)
{
    std::println("Literal brut: {}", rawString);
}

42_print; // Affiche "Literal brut: 42"
{% endhighlight %}

## Combinaison extrême

Pour illustrer la complexité de l'analyse lexicale du C++, voici un littéral qui combine presque toutes les fonctionnalités abordées dans cet article en une seule valeur:

{% highlight cpp %}
auto x = 0x14'2.e9'1'fp-1'3_e\u00e9l\u{d4}f;
{% endhighlight %}

Décortiquons rigoureusement ce "monstre" syntaxique:

1. **Préfixe ``0x``** : Indique que la valeur est exprimée en **hexadécimal**
2. **[Mantisse](https://fr.wikipedia.org/wiki/Mantisse) ``14'2.e9'1'f``**:
	- La partie entière est ``142`` (exprimée en hexadécimal)
	- La partie fractionnaire est ``e91f`` (exprimée en hexadécimal). ``e`` et ``f`` sont ici des chiffres hexadécimaux et non des préfixe/suffixe
	- Des **séparateurs de chiffres** (``'``) sont insérés arbitrairement pour la "lisibilité"
3. **Exposant ``p-1'3``**:
	- Le [**préfixe ``p``**](#hexadécimaux-à-virgule-flottante-c17) est **obligatoire pour les flottants hexadécimaux** et indique une **puissance de 2**
	- L'exposant ici est **-13** (exprimé en décimal)
4. [**Suffixe UDL**](#user-defined-literal-depuis-c11) ``_e\u00e9l\u{d4}f`` (``operator""_eélÔf``):
	- L'identifiant commence par un underscore (``_``)
	- Le caractère 'e'
	- Une séquence Unicode classique: [**``\u00e9``**](#codes-numériques-et-unicode) (lettre ``é``)
	- Le caractère 'l'
	- Une séquence Unicode délimitée (C++23): [**``\u{d4}``**](#codes-numériques-et-unicode) (lettre ``Ô``)
	- Le caractère 'f'

---

Aller plus loin:
- [Auto](/articles/c++/auto)
- [Encodages](/articles/c++/encoding)
- [Types Fondamentaux](/articles/c++/fundamental_types)
- [Les tailles en C++ (std::size_t)](/articles/c++/std_size_t)
