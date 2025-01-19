---
layout: article
title: Évolution du mot clef auto
permalink: articles/c++/auto
category: c++
logo: c++.svg
background: corridor4.webp
published: true
---

Le mot clef ``auto``, ses **avantages** et ses différents comportements **selon la version** et le contexte.

## Automatic storage duration specifier (avant C++11) (obsolète)

En langage C, ``auto`` (pour "**Automatic Storage Duration**") sert à spécifier qu'une variable a une **portée locale** à son bloc de code (**scope**).

C'est à dire, faire que la variable soit **supprimée à la sortie du scope**, contrairement aux variables globales ou statiques.

{% highlight c %}
void print42()
{
	auto int number = 42;
	printf("%d\n", number);
}
// La variable number n'existe pas en dehors de la fonction print42()
{% endhighlight %}

Dans les premières versions du langage C (Le ["C K&R"](/articles/c++/history_and_philosophy#c-kr)), il était obligatoire de déclarer explicitement les variables locales avec ``auto``.

Dès l'arrivée du [C ANSI (C89)](/articles/c++/history_and_philosophy#c-ansi-c89) en 1989, le comité de standardisation créé pour l'occasion décide de rendre les variables locales ``auto`` par défaut et le mot clef ``auto`` **optionnel**, le rendant par conséquent **redondant** et **inutile** à renseigner explicitement.<br>
Il reste cependant supporté dans les versions suivantes du C pour des raisons de rétrocompatibilité.

En C++, ``auto`` avait la même signification jusqu'au C++11.<br>
Mais cette utilisation du mot clef ``auto`` **était déjà largement obsolète bien avant l'introduction du C++11**.

A partir de C++11, le mot clef ``auto`` se voit attribuer une autre signification pour faire de l'**inférence de types**.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-stare.gif %}

## Placeholder type specifiers (depuis C++11)

Dès C++11, le mot clef ``auto`` permet de faire de l'**inférence de types**.<br>
En écrivant ``auto`` **à la place du type** d'une variable, **le type de la variable est déduit** à partir de la valeur à droite du signe égal.

{% highlight cpp %}
auto a = 1; // int
auto b = 2u; // unsigned int
auto c = "foo"; // const char*
auto d = std::string{"bar"}; // std::string
auto e = std::size(d); // std::size_t
auto f = 3uz; // std::size_t
auto g = { 1, 2, 3 }; // std::initializer_list<int>
auto h = std::array{ 1, 2, 3 }; // std::array<int, 3>
auto i = nullptr; // std::nullptr_t
{% endhighlight %}

> Les [literals](/articles/c++/literals) facilitent le typage lors de l'initialisation de variables.

Cette déduction de type est faite à la compilation (typage statique) et ne permet pas de faire du typage dynamique.<br>
Contrairement à ``var``/``let`` en JavaScript, le mot clef ``auto`` **ne permet pas à une variable de changer de type** en cours de route. Son type reste fixe.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-deduction.gif %}

Par défaut, ``auto`` ne récupère pas les propriétés **cvref** (``const``/``volatile``/``reference``) de la valeur qui lui est assignée.
Il faut penser à bien les renseigner pour **éviter les copies inutiles**.

{% highlight cpp %}
const std::string& Object::get_name() const;

auto string0 = object.get_name(); // Prend une copie
const auto& string1 = object.get_name(); // Prend une référence constante
{% endhighlight %}

Le ``*`` des raw-pointers est bien déduit par le mot clef ``auto``, mais il est préférable de l'expliciter en écrivant ``auto*``.

{% highlight cpp %}
auto string = std::string{"Hello World"};
auto c_string0 = std::data(string); // c_string0 est de type char*
auto* c_string1 = std::data(string); // c_string1 est de type char*
{% endhighlight %}

L'usage explicite de ``auto*`` permet de signaler de manière claire que vous travaillez avec des pointeurs, ce qui peut améliorer la lisibilité du code.

> A noter que l'écriture ``auto string = std::string{"Hello World"};`` est appelée "**auto to track**".<br>
> Elle consiste à forcer la variable ``string`` à adopter le type à droite du signe égal (``std::string``).<br><br>
> L'écriture ``auto c_string0 = std::data(string);`` est quant à elle nommée "**auto to stick**".<br>
> Elle consiste à déduire le type de la variable ``c_string0`` en fonction du type retourné par la fonction ``std::data``.

### Common type deduction

Lorsqu'un type dépend de plusieurs expressions, l'utilisation de ``auto`` permet au compilateur de déduire le [type commun](/articles/c++/type_traits#type_commun) entre les différentes expressions possibles.

Par exemple, dans le cas d'une ternaire où ``c`` peut se voir attribuer la valeur de ``a`` ou de ``b`` selon une condition:
{% highlight cpp %}
auto c = (a < b) ? a : b;
{% endhighlight %}

Si ``a`` et ``b`` sont de types différents, le mot clef ``auto`` permet de déduire automatiquement le [type commun](/articles/c++/type_traits#type_commun) de ces deux expressions.

{% highlight cpp %}
auto a = 10; // int
auto b = 3.14; // double

auto c = (a < b) ? a : b; // Type commun entre int et double (double)
{% endhighlight %}

Équivaut à:
{% highlight cpp %}
auto a = 10; // int
auto b = 3.14; // double

std::common_type_t<int, double> c = (a < b) ? a : b; // double
{% endhighlight %}

Ici, le type commun de ``int`` et ``double`` est le type ``double``, car un ``double`` peut être construit à partir d'un ``int`` mais l'inverse n'est pas possible directement.

{% row %}
{% highlight cpp %}
double a = 10; // int vers double: Ok
int b = 3.14; // double vers int: Erreur
{% endhighlight %}

{% highlight console %}
<source>:9:27: error: implicit conversion from 'double' to 'int' changes value from 3.14 to 3 [-Werror,-Wliteral-conversion]
    9 |         int b = 3.14;
{% endhighlight %}
{% endrow %}

### Typer une lambda

``auto`` permet également de typer une lambda.<br>
En effet, en C++ **chaque lambda a un type unique qui lui est propre**, et ce, même si plusieurs lambdas ont la même signature.<br>
Ecrire explicitement leur type est donc impossible.
L'utilisation du mot clef ``auto`` **est le seul moyen de typer une variable contenant une lambda**:

{% highlight cpp %}
auto sum = [](int lhs, int rhs) -> int { return lhs + rhs; };
{% endhighlight %}

Attention, le mot clef ``auto`` est **différent pour les paramètres de fonctions**. On aborde ce point [plus bas](#abbreviated-function-template-depuis-c20).

#### Oublier une conversion explicite

Par négligence ou par méconnaissance de la bibliothèque standard, on peut penser que les deux codes suivants sont identiques:

{% row %}
{% highlight cpp linenos highlight_lines="2" %}
auto bits = std::vector<bool>{0};
[[maybe_unused]] auto bit = bits[0];
bit = true;
std::cout << std::boolalpha << bits[0]; // Affiche "true"
{% endhighlight %}

{% highlight cpp linenos highlight_lines="2" %}
auto bits = std::vector<bool>{0};
[[maybe_unused]] bool bit = bits[0];
bit = true;
std::cout << std::boolalpha << bits[0]; // Affiche "false"
{% endhighlight %}
{% endrow %}

Ici on est face à une particularité de la bibliothèque standard.<br>
Le type ``std::vector<T>`` est spécialisé pour le type ``bool`` pour avoir un **comportement différent** de celui de base.<br>
``std::vector<bool>::operator[]`` **ne retourne pas un ``bool``**, mais un **proxy** permettant de modifier le bit stocké dans le conteneur. Et ce, malgré l'utilisation de ``auto`` sans référence.

> Si ces problématiques autour de **``std::vector<bool>``** vous intéresse, [**un autre article**](/articles/c++/std_vector_bool#spécialisation-du-type-stdvectorbool) développe ses particularités et vous propose une bien **meilleure alternative** ([``std::bitset``](/articles/c++/std_vector_bool#stdbitsetn)).

Un moyen d'éviter ce problèmes consiste à rendre explicite la conversion:

{% highlight cpp linenos highlight_lines="2" %}
auto bits = std::vector<bool>{0};
[[maybe_unused]] bool bit = bits[0]; // Conversion implicite de proxy vers bool
bit = true;
std::cout << std::boolalpha << bits[0]; // Affiche "false"
{% endhighlight %}

{% highlight cpp linenos highlight_lines="2" %}
auto bits = std::vector<bool>{0};
[[maybe_unused]] auto bit = static_cast<bool>(bits[0]); // Conversion explicite
bit = true;
std::cout << std::boolalpha << bits[0]; // Affiche "false"
{% endhighlight %}

> **L'absence de conversions implicites avec ``auto`` force à les expliciter.** Ce qui est une **bonne pratique** pour **éviter les comportements cachés**, **inattendus** et **indésirables**.

## Trailing return type (depuis C++11)

En C++, le type de retour des fonctions est écrit au début de leur définition/déclaration:

{% highlight cpp %}
int sum(int lhs, int rhs)
{
	return lhs + rhs;
}
{% endhighlight %}

Dans d'autres langages, le type est la plupart du temps spécifié à la fin de leur définition/déclaration:

En Python:
{% highlight py %}
def sum(lhs: int, rhs: int) -> int
	return lhs + rhs
{% endhighlight %}

En Typescript:
{% highlight ts %}
function sum(lhs: number, rhs: number) : number
{
	return lhs + rhs;
}
{% endhighlight %}

Pour revenir au C++, le **trailing return type** permet de spécifier le type de retour des fonctions à la fin de leur définition/déclaration (depuis C++11):

{% highlight cpp %}
auto sum(int lhs, int rhs) -> int
{
	return lhs + rhs;
}
{% endhighlight %}

Cette écriture permet entre autre de définir un type de retour qui dépend des paramètres de la fonction.

{% highlight cpp %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs) -> decltype(lhs + rhs)
{
	return lhs + rhs;
};
{% endhighlight %}

> Si vous n'êtes pas familiers avec les templates, passez faire un tour [ici](/articles/c++/templates).
> Et pour ``decltype(expression)``, c'est [ici](/articles/c++/value_categories#decltype).

Cela n'est pas possible avec l'ancienne écriture des fonctions:

{% highlight cpp %}
template<class Lhs, class Rhs>
decltype(lhs + rhs) sum(Lhs lhs, Rhs rhs)
{
	return lhs + rhs;
};
{% endhighlight %}

> \<source\>:5:10: **error**: 'lhs' was not declared in this scope;<br>
> \<source\>:5:16: **error**: 'rhs' was not declared in this scope;

Le compilateur comprend les déclarations dans l'ordre dans lequel il les lit. Et comme il lit les fichiers de haut en bas et de gauche à droite, il ne connait pas encore ``lhs`` et ``rhs`` à l'instant où on les utilise dans ``decltype(lhs + rhs)``.

Cette nouvelle syntaxe apporte aussi une **uniformisation entre la syntaxe des fonctions et celle des lambdas**.

Les lambdas (C++11) s'écrivent de la façon suivante, avec le type de retour à droite:
{% highlight cpp %}
auto sum = [](int lhs, int rhs) -> int {
	return lhs + rhs;
};
{% endhighlight %}

A noter qu'ici, ``auto`` n'est pas le type de la valeur de retour de la lambda, mais le type de la lambda elle-même.<br>
Ca a été abordée dans la [section précédente](#placeholder-type-specifiers-depuis-c11).

> En résumé, utiliser ``auto`` avec le trailing return type permet d'**uniformiser** la manière dont les types de retour sont déclarés et assure une meilleure lisibilité, surtout dans les fonctions dont le type de retour dépend des paramètres.<br>
> Cette pratique est **recommandée en C++ moderne**.

## AAA (Almost Always Auto) (depuis C++11)

Le principe **AAA (Almost Always Auto)** a vu le jour dès le C++11 pour encourager l'utilisation d'``auto`` par défaut.

Comme nous venons de le voir, ``auto`` apporte de nombreux avantages, aussi bien pour la lisibilité et l'apport de nouvelles fonctionnalités.

Quelques avantages notables à utiliser ``auto`` :

- **Force l'initialisation des variables**, évitant au développeur un oubli d'initialisation (``int i;``), évitant ainsi des erreurs
- Évite les **conversions implicites** lors de l'initialisation des variables (``float f = 1;``: conversion implicite de int vers float)
- Plus **agréable à écrire** pour les types longs (Par exemple les itérateurs)
- Couplé à l'[initialisation uniforme](/articles/c++/uniform_initialization), il contribue à réduire la charge mentale causée par les multiples façons d'écrire la même chose. Le C++ devient un langage beaucoup plus lisible et abordable.
- Le type est déjà renseigné (ou déduit) à droite du signe égal, **pas de redondance** en l'écrivant aussi à gauche.
- Les **templates** deviennent beaucoup **plus lisibles**
- ``auto`` est le seul moyen de **typer une lambda**

Mais il reste un problème:<br>
Dans l'écriture suivante, le compilateur n'est pas tenu de considérer la ligne comme étant une **simple initialisation de variable**:
{% highlight cpp %}
auto string = std::string{"Hello World"};
{% endhighlight %}
Le compilateur peut considérer cette instruction comme étant la **création d'une valeur**, **puis son déplacement** dans la variable ``string``. Engendrant un léger surcoût.

> Il ne faut cependant pas négliger les capacités d'optimisation des compilateurs, qui la plupart du temps parviennent à supprimer le coût de ces déplacements.

Ce surcoût est généralement considéré comme négligeable, sauf dans certains cas où l'opération est coûteuse:
{% highlight cpp %}
auto array = std::array{1, 2, 3, 4, 5};
{% endhighlight %}

``std::array`` étant un [type trivial](/articles/c++/move_semantic#type-trivial), **son déplacement fait une copie**, représentant là aussi un surcoût.<br>
Ici aussi, on peut décider de ne pas utiliser ``auto`` pour éviter ce surcoût.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-please-stop.gif %}

Dans certains cas, l'écriture avec ``auto`` est même impossible. Lorsqu'un type est non-copyable ET non-movable:
{% highlight cpp %}
auto m = std::mutex{}; // Ne compile pas en C++14
{% endhighlight %}
{% highlight cpp %}
std::mutex m{};
auto lock = std::lock_guard<std::mutex>{m}; // Ne compile pas en C++14
{% endhighlight %}
{% highlight cpp %}
std::mutex m{};
std::lock_guard<std::mutex> lock{m}; // Compile
{% endhighlight %}

Ceci explique le "**Almost**" dans "Almost Always Auto". On est passé à ça 🤏 d'avoir une règle d'écriture uniforme.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-i-believed-in-you.gif %}

Mais ne vous arrêtez pas au "**Almost** Always Auto", nous allons revenir sur ce point par la suite avec l'[**Always Auto**](#aa-always-auto-depuis-c17).

Certains développeurs préfèrent utiliser ``auto`` **avec parcimonie**, en **remplacement de types particulièrement verbeux** (notamment les **iterateurs**).

Parfois en évitant de l'utiliser à cause des noms de fonctions et variables **pas assez explicites** sur le type qu'elles contiennent ou retournent (c'est l'argument principal que j'entend).<br>
Ceci est très courant, notamment dans un cadre professionnel où plusieurs développeurs collaborent sur le même projet.<br>
Aux personnes qui sont dans cette situation, je recommanderais d'utiliser un IDE qui montre les **types des variables** et les **signatures des fonctions** au **survol de la souris**.

D'autres seraient même tentés de ne jamais utiliser ``auto``, et passer à côté de tous les autres avantages qu'il apporte.

Et d'autres personnes prônent l'utilisation **quasi systématique** de ``auto``, comme Scott Meyers ([Effective Modern C++](https://www.amazon.fr/Effective-Modern-C-Scott-Meyers/dp/1491903996)) et [Herb Sutter](https://herbsutter.com/2013/08/12/gotw-94-solution-aaa-style-almost-always-auto/).

## ``auto`` as a return type (depuis C++14)

A partir de C++14, on peut **laisser le compilateur déduire le type de retour** d'une fonction à partir des ``return`` qui la composent:

{% highlight cpp highlight_lines="2" %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs)
{
	return lhs + rhs;
};
{% endhighlight %}

Cependant, ce n'est pas une écriture que vous verrez souvent car elle **comporte des risques** et qu'elle **ne couvre pas toutes les situations**.

Retourner ``auto`` peut être suffisant **dans les définitions** car le compilateur a accès aux ``return`` pour déduire le type à retourner.<br>
Mais **pas dans les déclarations** car le compilateur n'a **pas accès au corps de la fonction** pour déduire le type de retour (par exemple lorsqu'on importe les headers d'une bibliothèque sans en avoir les sources).

Dans  l'exemple suivant, un **``auto`` as a return type** est utilisé dans ``Sum.cpp``, mais pas dans ``Sum.h``.<br>
Dans ``Sum.h`` on utilise un [**Trailing return type**](#trailing-return-type-depuis-c11) pour **renseigner explicitement le type de retour**.

Sum.h
{% highlight cpp highlight_lines="2" %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs) -> decltype(lhs + rhs);
{% endhighlight %}

Sum.cpp
{% highlight cpp %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs)
{
	return lhs + rhs;
};
{% endhighlight %}

Il arrive que la fonction contienne plusieurs ``return``.

Contrairement aux ternaires, sur lesquelles [``auto`` déduit automatiquement le type commun](#common-type-deduction), ``auto`` comme type de retour **exige que toutes les valeurs retournées partagent exactement le même type**.

{% highlight cpp %}
auto getText(int value)
{
	if (value >= 0)
		return "La valeur est positive"; // const char*
	else
		return std::string_view{"La valeur est négative"}; // std::string_view
};
{% endhighlight %}

Ceci provoque une erreur de compilation, bien qu'un [type commun](/articles/c++/type_traits#type_commun) existe (``std::string_view``)

> \<source\>:9:29: **error**: inconsistent deduction for auto return type: 'const char*' and then 'std::basic_string_view<char>'

L'ambiguïté peut être résolue en précisant explicitement le type:

{% highlight cpp %}
auto getText(int value) -> std::string_view
{
	if (value >= 0)
		return "La valeur est positive"; // const char*
	else
		return std::string_view{"La valeur est négative"}; // std::string_view
};
{% endhighlight %}

Le compilateur tente maintenant de construire un ``std::string_view`` à partir du ``const char*`` retourné. Ce qui est fait via un appel implicite à un constructeur de ``std::string_view``.

> Attention toutefois: **Evitez les conversions implicites** autant que possible, c'est une mauvaise pratique. Le code précédemment n'est là qu'a des fins de démonstration pour montrer les problèmes que l'on peut rencontrer avec le *auto as a return type*
{: .block-warning }

Notez qu'il est possible de retourner ``auto`` en suivant le *trailing return type* pour respecter l'uniformisation:

{% highlight cpp %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs) -> auto
{
	return lhs + rhs;
};
{% endhighlight %}

Ici, il n'y a pas de redondance du mot clef ``auto``.<br>
**Seul celui à droite désigne le type de retour** de la fonction.<br>
Celui de gauche est simplement nécessaire pour l'écriture du *trailing return type*.

> Ici, il n'y a aucun intérêt autre que l'uniformisation d'écrire ``-> auto``.<br>
> Ecrire simplement ``auto sum(Lhs lhs, Rhs rhs)`` revient au même.

## ``decltype(auto)`` (depuis C++14)

Contrairement à ``auto``, ``decltype(auto)`` permet de **préserver les propriétés cvref** (``const``/``volatile``/``reference``) d'une expression.

``decltype(auto)`` est particulièrement utile lorsqu'il est nécessaire de préserver la nature exacte de l'expression retournée, que ce soit une référence ou un type constant:

{% highlight cpp linenos highlight_lines="5" %}
int foo();
int& bar();

template<class Function>
auto call(Function function) -> decltype(auto)
{
	return function();
};

// call(foo) retourne un int
// call(bar) retourne un int&
{% endhighlight %}

``decltype(auto)`` est aussi utilisable pour initialiser une variable en conservant les propriétés cvref de la valeur assignée:
{% highlight cpp linenos highlight_lines="3" %}
auto main() -> int
{
	decltype(auto) result = call(bar);
	return result;
};
{% endhighlight %}

Avec cette initialisation de variable, il est possible de faire ceci:

{% highlight cpp %}
auto i = 10; // int
decltype(auto) j = i; // int
decltype(auto) k = (i); // int&
{% endhighlight %}

L'utilisation de **parenthèses** autour de ``i`` **force la déduction en référence**.<br>
Sans les parenthèses, le résultat est une copie.

## Structured binding declaration (depuis C++17)

Les *[structured binding declaration](https://en.cppreference.com/w/cpp/language/structured_binding)* ([proposal](https://wg21.link/P1061R10)) permettent de décomposer des objets en plusieurs variables individuelles.

Cette fonctionnalité est compatible avec:
- Les *C-like array* (tableaux de taille fixe)
- Les [tuple-like](/articles/c++/std_tuple#tuple-like) (``std::array``, ``std::tuple``, ``std::pair``)
- Les classes/structures ayant toutes leurs variables membres publiques

Leur écriture est conçue comme une variante des déclarations de variables.
En renseignant plusieurs noms de variables au lieu d'un seul.

{% highlight cpp %}
auto [x, y, z] = container;
{% endhighlight %}

### C-like array

{% highlight cpp linenos highlight_lines="6" %}
auto main() -> int
{
	int position[2];
	position[0] = 10;
	position[1] = 15;
	auto [x, y] = position;
	std::print("{} {}\n", x, y); // Affiche "10 15"
}
{% endhighlight %}

> Notez que **les C-like array** sont **à éviter en C++**. Préférez l'utilisation de [``std::array``](#stdarray).

### ``std::array``

{% highlight cpp linenos highlight_lines="4" %}
auto main() -> int
{
	auto position = std::array<int>{10, 15};
	auto [x, y] = position;
	std::print("{} {}\n", x, y); // Affiche "10 15"
}
{% endhighlight %}

### ``std::tuple``

{% highlight cpp highlight_lines="3" %}
using namespace std::literals;
auto pair = std::tuple{1, 2.2, "text"sv};
auto [integer, decimal, string] = pair;
std::print("{} {} {}", integer, decimal, string);
{% endhighlight %}

> Ce n'est pas parce qu'il y a écrit ``auto`` devant une *structured binding declaration* que les variables partagent le même type. **Chaque variable peut avoir un type différent**.<br>
> Ici, **``auto`` [ne désigne pas le type des variables déstructurées](#sous-le-capot)**.

### ``std::pair``
{% highlight cpp highlight_lines="2" %}
auto pair = std::pair{1, 2};
auto [x, y] = pair;
std::print("{} {}", x, y); // Affiche "1 2"
{% endhighlight %}

Grace à ``std::pair`` il est possible d'obtenir les clefs et valeurs dans une *range-based for loop* sur une ``std::map``/``std::unordered_map``.

{% highlight cpp highlight_lines="5" %}
using namespace std::literals;
auto map = std::unordered_map{
	std::pair{ "key1"sv, "value1"sv }
};
for (const auto& [key, value] : map)
	std::print("{} {}", key, value); // Affiche "key1 value1"
{% endhighlight %}

> Cette utilisation au sein d'un **range-based for loop**, pour séparer clef et valeur, est **l'un des principaux cas d'utilisation** des *structured binding declaration*.

### Classes/Structures

Les classes/structures ayant **toutes leurs variables membres publiques** sont déstructurables avec une *structured binding declaration*:

{% highlight cpp linenos highlight_lines="10" %}
struct Position2d
{
	int x;
	int y;
};

auto main() -> int
{
	auto position = Position2d{10, 15}; // Construction d'un Position2d avec x vallant 10 et y vallant 15
	auto [x, y] = position; // Extraction des variables membre de Position2d
	std::print("{} {}\n", x, y); // Affiche: "10 15"
}
{% endhighlight %}

La déstructuration doit **respecter l'ordre des paramètres**.<br>
**Leur nom n'a pas d'importance**, il peut être changé. Par exemple: ``auto [foo, bar] = position;``

{% highlight cpp linenos highlight_lines="10" %}
struct Position2d
{
	int x;
	int y;
};

auto main() -> int
{
	auto position = Position2d{10, 15};
	auto [a, b] = position;
	std::print("{} {}\n", a, b); // Affiche: "10 15" malgré l'utilisation de noms de variables différents
}
{% endhighlight %}

**Le nombre de variables** issues de la décomposition doit être **strictement égal** au **nombre de valeurs déstructurables**. Et ce, quelque soit le type du conteneur.<br>
Ceci est également valable pour [chaque type cité ci-dessous](#c-like-array)

{% highlight cpp %}
auto position = Position2d{10, 15};
auto [x] = position; // error: type 'Position2d' decomposes into 2 elements, but only 1 name was provided
auto [x, y] = position; // Ok
auto [x, y, z] = position; // error: type 'Position2d' decomposes into 2 elements, but 3 names were provided
{% endhighlight %}

### Propriétés cvref

Les *structured binding declarations* supportent les propriétés *cvref*, permettant d'éviter des copies inutiles ou de modifier les données contenues dans le conteneur:

{% highlight cpp linenos highlight_lines="13" %}
struct Person
{
	std::string name;
	unsigned int age;
};

auto main() -> int
{
	auto person = Person{"John Smith", 42};

	{
		auto& [name, age] = person; // name et age sont récupérés par références non-constantes
		++age;
	}
	
	{
		const auto& [name, age] = person; // name et age sont récupérés par références constantes
		std::print("{} a {} ans\n", name, age); // Affiche "John Smith a 43 ans"
	}
}
{% endhighlight %}

Pour mieux comprendre ces mécanismes, regardons comment ça fonctionne sous le capot.

### Sous le capot

En C++, ``auto`` fait partie des éléments du langage qui ne sont que du **sucre syntaxique**, c'est à dire une écriture concise qui se déploie en un code plus complexe et verbeux.<br>
C'est à la compilation que le compilateur va "remplacer" les ``auto`` par un code plus verbeux.

Pour les cas d'usage simples, ``auto`` est simplement "remplacé" par le type déduit:
{% row %}
{% highlight cpp %}
auto i = 42;
{% endhighlight %}
{% highlight cpp  %}
int i = 42; // Résolution du type auto à la compilation
{% endhighlight %}
{% endrow %}

> En réalité, dans cet exemple simple on dit que [**le type est inféré**](https://fr.wikipedia.org/wiki/Inférence_de_types). Ici il ne s'agit pas réellement d'un remplacement de code, mais ça abouti au même résultat.

Pour les cas un peu plus complexes comme les *structured binding declaration*, ``auto`` est remplacé par un code légèrement plus complexe:
{% highlight cpp %}
int array[2] = {1, 2};
auto [x, y] = array;
{% endhighlight %}

Equivalent produit par le compilateur:
{% highlight cpp %}
int array[2] = {1, 2};
int __array7[2] = {array[0], array[1]};
int & x = __array7[0];
int & y = __array7[1];
{% endhighlight %}

Ici, ``__array7`` est une variable créée par le compilateur à des fins de décomposition, elle aurait pu avoir n'importe quel nom tant qu'elle commence par ``__``.<br>
Les noms commençant par ``__`` sont strictement réservés aux besoins internes du compilateur, pour ce genre de cas.<br>

C'est le type de cette variable ``__array7`` qu'on a défini en écrivant ``auto`` devant la *structured binding declaration*.

{% highlight cpp %}
int i = 1;
int j = 2;
auto& [x, y] = std::make_tuple<int&, int&>(i, j); // error: non-const lvalue reference to type 'tuple<...>' cannot bind to a temporary of type 'tuple<...>'
{% endhighlight %}

``std::make_tuple`` retourne un objet temporaire, qui ne peut pas être affecté à une *lvalue reference* non constante.

Autre exemple avec ``const auto&``:
{% highlight cpp %}
int array[2] = {1, 2};
const auto& [x, y] = array;
{% endhighlight %}

Equivalent produit par le compilateur:
{% highlight cpp %}
int array[2] = {1, 2};
const int (&__array7)[2] = array;
const int & x = __array7[0];
const int & y = __array7[1];
{% endhighlight %}

Les propriétés cvref sont appliquées à ``__array7`` et répercutées sur ``x`` et ``y``.

Testons maintenant avec un *[tuple-like](/articles/c++/std_tuple#tuple-like)*:

{% highlight cpp %}
auto p = std::pair{1, 2};
auto [x, y] = p;
{% endhighlight %}

Equivalent produit par le compilateur:
{% highlight cpp %}
std::pair<int, int> p = std::pair<int, int>{1, 2};
std::pair<int, int> __p7 = std::pair<int, int>(p);
int && x = std::get<0UL>(static_cast<std::pair<int, int> &&>(__p7));
int && y = std::get<1UL>(static_cast<std::pair<int, int> &&>(__p7));
{% endhighlight %}

On remarque que lorsqu'on utilise une déstructuration sur un [tuple-like](/articles/c++/std_tuple#tuple-like), le compilateur transforme implicitement le code en appels à [``std::get``](https://en.cppreference.com/w/cpp/utility/tuple/get).

Pour les classes/structures n'ayant que des variables membres publiques, la déstructuration n'appelle pas ``std::get``. Le compilateur génère un accès direct aux membres dans l'ordre de leur déclaration.

> Vous pouvez faire vos propres analyses de transpilation de codes C++ sur l'outil en ligne [CppInsights](https://cppinsights.io/).

### Variables membres privées

[Pour rappel](#structured-binding-declaration-depuis-c17), les types compatibles avec les *structured binding declaration* sont:
- Les *C-like array* (tableaux de taille fixe)
- Les [tuple-like](/articles/c++/std_tuple#tuple-like) (``std::array``, ``std::tuple``, ``std::pair``)
- Les classes/structures ayant toutes leurs variables membres publiques

Si une classe/structure contient des variables membre privées, il n'est pas possible de les ignorer dans une *structured binding declaration*.

{% highlight cpp linenos %}
struct Person
{
	Person(std::string firstName, std::string lastName, int birthYear):
		firstName{std::move(firstName)},
		lastName{std::move(lastName)},
		birthYear{birthYear}
	{}

    std::string firstName;
	std::string lastName;
private:
    std::size_t age = 3;
};

auto main() -> int
{
    auto person = Person{};
    auto [firstName, lastName] = person; // error: type 'Person' decomposes into 3 elements, but only 2 names were provided
	auto [firstName, lastName, age] = person; // error: cannot decompose private member 'age' of 'Person'
}
{% endhighlight %}

Cette structure ``Person`` **ne répond plus aux exigences pour être déstructurable** (qui est "**avoir toutes ses variables membres publiques**").<br>
Mais il est possible de **transformer cette structure** pour qu'elle puisse **satisfaire les critères d'un [tuple-like](/articles/c++/std_tuple#tuple-like)**.<br>
Elle en deviendrait déstructurable.

Pour cela il faut la rendre compatible avec [``std::get``](https://en.cppreference.com/w/cpp/utility/tuple/get).
Ce qui implique d'ajouter:
- Une spécialisation de ``std::tuple_size``
- Une spécialisation de ``std::tuple_element``

{% highlight cpp linenos highlight_lines="42" %}
struct Person
{
	Person(std::string firstName, std::string lastName, int birthYear):
		firstName{std::move(firstName)},
		lastName{std::move(lastName)},
		birthYear{birthYear}
	{}

	// Fonction membre pour accéder aux variables membres depuis la spécialisation de std::tuple_element<I, Person>
	template<std::size_t I, class T>
	constexpr auto&& get(this T&& self) noexcept
	{
		if constexpr (I == 0)
			return std::forward<T>(self).firstName;
		else if constexpr (I == 1)
			return std::forward<T>(self).lastName;
		else if constexpr (I == 2)
			return std::forward<T>(self).birthYear;
	}

    std::string firstName;
	std::string lastName;
private:
	int birthYear;
};

// Spécialisation de std::tuple_size pour le type Person. Pour préciser qu'il contient 3 éléments.
template <>
struct std::tuple_size<Person>: std::integral_constant<std::size_t, 3>
{};

// Spécialisation de std::tuple_element pour le type Person. Pour accéder aux éléments.
template <std::size_t I>
struct std::tuple_element<I, Person>
{
    using type = std::remove_cvref_t<decltype(std::declval<Person>().get<I>())>;
};

auto main() -> int
{
	auto person = Person{"Bjarne", "Stroustrup", 1950};
	const auto& [firstName, lastName, birthYear] = person;
	std::print("{} {} est né en {}\n", firstName, lastName, birthYear);
}
{% endhighlight %}

Si la classe/structure contenait d'autres variables publiques ou privées, elles ne seraient pas récupérables avec la *structured binding declaration* tant qu'elles ne sont pas supportées par ces éléments que nous venons d'ajouter.

### constexpr Structured Binding (depuis C++26)

Avant C++26, les *structured binding declaration* ne peuvent pas être constexpr:
{% highlight cpp %}
constexpr auto [x, y] = std::pair{1, 2}; // error: structured binding declaration cannot be 'constexpr'
{% endhighlight %}

Depuis C++26 ([proposal](https://wg21.link/p2686r5), [approval](https://wg21.link/P2686r5/status)), les *structured binding declaration* supportent constexpr.<br>
Ce n'est cependant [pas encore supporté par les compilateurs](https://en.cppreference.com/w/cpp/26) à l'heure où j'écris.

### Attributs individuels (depuis C++26)

Les *structured binding declaration* ne supportent pas les [attributs](/articles/c++/attributes) individuels avant C++26:
{% highlight cpp %}
int i = 0, j [[maybe_unused]] = 0; // Ok, individual attributes
auto [k, l [[maybe_unused]] ] = std::pair{1, 2}; // warning: an attribute specifier sequence attached to a structured binding declaration is a C++2c extension [-Wc++26-extensions]
[[maybe_unused]] auto [x, y] = std::pair{1, 2}; // Ok
{% endhighlight %}

A noter que le compilateur se plaint d'une variable non utilisée seulement lorsque toutes les variables d'un *structured binding declaration* sont inutilisées.
{% highlight cpp %}
auto [x, y] = std::pair{1, 2}; // warning: unused variable '[x, y]' [-Wunused-variable]
{% endhighlight %}
Si on utilise au moins une des variables, la *structured binding declaration* devient pertinente pour extraire la ou les valeurs utiles, donc cet avertissement disparait.
{% highlight cpp %}
auto [x, y] = std::pair{1, 2}; // Ok
auto n = x; // warning: unused variable 'n' [-Wunused-variable]
{% endhighlight %}

### Structured binding declaration as a condition (depuis C++26)

Avant C++26, les *structured binding declaration* ne sont pas autorisées dans les conditions:
{% highlight cpp %}
if (auto [x, y] = std::pair{1, 2}) {} // warning: ISO C++17 does not permit structured binding declaration in a condition [-Wbinding-in-condition]
{% endhighlight %}

Il est cependant possible de les utiliser dans la partie initialisation des conditions ([init-statement (C++17)](/articles/c++/control_flow#init-statement-depuis-c17)), dans laquelle elles se comportent comme n'importe quelle déclaration écrite à cet endroit:
{% highlight cpp %}
if (auto [x, y] = std::pair{1, 2}; x == y) {} // Ok
{% endhighlight %}

Depuis C++26, il est possible d'écrire directement une *structured binding declaration* dans la partie conditionnelle  ([proposal](https://wg21.link/p0963r3), [approval](https://wg21.link/p0963r3/status)), apportant une nouvelle mécanique que nous allons détailler.

{% highlight cpp %}
if (auto [x, y] = std::pair{1, 2}) {} // Ok depuis C++26
{% endhighlight %}

Cette écriture n'est pas sans rappeler les [*range-based for loop*](/articles/c++/control_flow#range-based-for-loop-depuis-c11) dans lesquelles il est également possible d'utiliser une *structured binding declaration* pour décomposer l'objet pointé par l'iterateur.

{% highlight cpp %}
for (auto [x, y] : container) {}
{% endhighlight %}

C'est dans cette optique qu'a été proposé le port des *structured binding declaration* aux conditions.

Dans une *range-based for loop*, **la condition n'évalue pas les variables issues de la décomposition, mais l'itérateur**. Ainsi, la boucle se poursuit **jusqu'à atteindre la [valeur sentinelle](https://fr.wikipedia.org/wiki/Valeur_sentinelle)** signalant la fin des éléments itérables.

La *structured binding declaration* dans une condition fait une vérification un peu similaire sur l'objet.
La condition **caste l'objet en bool** pour vérifier la validité de la condition, **puis décompose ses éléments**.

{% highlight cpp linenos highlight_lines="6 15" %}
struct Stock
{
    unsigned int available;
    unsigned int reserved;

    explicit operator bool() const noexcept
	{
		return available >= reserved;
	}
};

auto main() -> int
{
    auto stock = Stock{10, 3};
    if (auto [available, reserved] = stock)
        std::print("Articles prêts pour livraison: {}\nStock total: {}\n", reserved, available);
    else
        std::print("Stock insuffisant!\n");
}
{% endhighlight %}

{% highlight console %}
Articles prêts pour livraison: 3
Stock total: 10
{% endhighlight %}

> Attention, contrairement aux *range-based for loop* qui utilisent le caractère ``:`` comme **séparateur entre élément et conteneur** (symbolisant l'opération d'itération), une *structured binding declaration* dans une condition est bien une **déclaration complète**, sans séparateur. C'est pourquoi on y trouve un ``=`` et non un ``:``.<br>
> ``for (auto [x, y] : container)`` (pas de ``=``)<br>
> ``if (auto [x, y] = std::pair{1, 2})`` (pas de ``:``)
{: .block-warning }

Certains types standards supportent leur utilisation au sein d'une *structured binding declaration* dans une condition, nous allons en voir quelques uns.

#### Structured binding declaration: ``std::from_chars`` / ``std::to_chars``

La fonction ``std::to_chars``, permettant d'**écrire un nombre dans une chaîne de caractères**, retourne une structure ``std::to_chars_result`` informant l'appelant du bon déroulé de cette écriture.<br>
Cette structure contient 2 variables membres publiques **pouvant être décomposées** par une *structured binding declaration*:

| Member name | Définition |
| ``ptr`` | a pointer of type ``char*`` (public) |
| ``ec`` | an error code of type [``std::errc``](https://en.cppreference.com/w/cpp/error/errc) (public) |

([Source: CppReference ``std::to_chars_result``](https://en.cppreference.com/w/cpp/utility/to_chars_result#Data_members))

Cette structure a la particularité d'avoir un [``operator bool()``](https://en.cppreference.com/w/cpp/utility/to_chars_result#operator_bool) en C++26, lui permettant d'être **utilisable dans une condition**.<br>
Cet opérateur vérifie que sa variable membre publique ``ec`` (error code) ne contient aucun code d'erreur (``std::errc{}``).

Avant C++26, on utilise l'écriture:
{% highlight cpp linenos highlight_lines="3 4" %}
auto string = std::string{};
string.resize(20);
if (auto [pointer, errorCode] = std::to_chars(std::data(string), std::data(string) + std::size(string), 3.14);
	errorCode == std::errc{})
	std::print("{}\n", string);
else
{
	// Gestion d'erreur
}
{% endhighlight %}
([Pour la gestion d'erreur](https://en.cppreference.com/w/cpp/error/errc#Example))

> Dans le code précédent, remarquez l'utilisation de l'[*init-statement*](/articles/c++/control_flow#init-statement-depuis-c17) dans la condition pour restreindre la portée des variables ``pointer`` et ``errorCode`` au scope de cette condition.

Depuis C++26, on peut écrire:
{% highlight cpp linenos highlight_lines="3" %}
auto string = std::string{};
string.resize(20);
if (auto [pointer, errorCode] = std::to_chars(std::data(string), std::data(string) + std::size(string), 3.14))
	std::print("{}\n", string);
else
{
	// Gestion d'erreur
}
{% endhighlight %}

> La même chose pourrait être dite au sujet de la fonction [``std::from_chars``](https://en.cppreference.com/w/cpp/utility/from_chars), qui sert à **parser un nombre** dans une chaîne de caractères.

## ``auto`` in template parameters (depuis C++17)

> Si vous n'êtes pas familiers avec les templates, passez faire un tour [ici](/articles/c++/templates).

Vous avez surement remarqué que certains templates prennent des valeurs, au lieu de prendre des types.

Par exemple:
{% highlight cpp %}
auto array = std::array<int, 3>{ 1, 2, 3 };
{% endhighlight %}

Ici, on instancie un ``std::array`` contenant 3 éléments de type ``int``. Le nombre d'éléments est renseigné en template.

Le passage de valeur en template est possible en écrivant le type accepté à la place de ``typename``/``class`` dans la template (``template<std::size_t>``):

{% highlight cpp %}
template<std::size_t value>
constexpr auto constant = value;
constexpr auto IntConstant42 = constant<42>;
{% endhighlight %}

Pour plus de généricité, il est également possible de le définir avec ``auto`` (``template<auto>``).
Ici, ``auto`` sert à indiquer une valeur en template qui sera déduite à l'instantiation.

{% highlight cpp %}
template<auto value>
constexpr auto constant = value;
constexpr auto IntConstant42 = constant<42>;
{% endhighlight %}

Equivaut à:

{% highlight cpp %}
template<class Type, Type value>
constexpr Type constant = value;
constexpr auto IntConstant42 = constant<int, 42>;
{% endhighlight %}

``template<auto>`` accepte toute *constant expression*, c'est à dire toute valeur connue à la compilation (integral, pointer, pointer to member, enum, lambda, constexpr object).

> ``template<auto>`` ne supporte pas le type ``double`` avant C++20.
{: .block-warning }

Utilisé dans une variadic, chaque valeur passée en template peut avoir son propre type:

{% highlight cpp %}
template<auto... vs>
struct HeterogenousValueList {};
using MyList = HeterogenousValueList<42, 'X', 13u>;
{% endhighlight %}

## AA (Always Auto) (depuis C++17)

En C++17, le langage garanti la [copy elision](/articles/c++/copy_elision), faisant disparaitre les surcoûts que nous avons vu [à la fin de la partie sur "Amost Always Auto"](#aaa-almost-always-auto-avant-c17), rendant l'utilisation de ``auto`` possible même sur des types qui ne sont ni copyables, ni movables.

La [copy elision](/articles/c++/copy_elision) est une optimisation qui élimine la création et la copie d'objets temporaires ([prvalue](/articles/c++/value_categories#prvalue)). Au lieu de créer une copie intermédiaire, l'objet est directement construit à l'emplacement final.

Suite à ce changement dans le langage, Herb Sutter soutient le passage de AAA à AA.

A votre tour de prendre le pas et d'adopter ``auto`` dans vos projets.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-fusco.gif %}

## Abbreviated function template (depuis C++20)

Les templates ont toujours été très verbeuses.

{% highlight cpp %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs) -> auto
{
	return lhs + rhs;
};
{% endhighlight %}

Depuis C++20, il est possible d'utiliser ``auto`` comme syntaxe alternative aux templates, améliorant grandement leur lisibilité:

{% highlight cpp %}
auto sum(auto lhs, auto rhs) -> auto
{
	return lhs + rhs;
};
{% endhighlight %}

> Attention, derrière ses airs de [placeholder type specifiers](#placeholder-type-specifiers-depuis-c11), il s'agit ici bien de **types templatés**.<br>
> Une template n'est **pas toujours souhaitable**. Dans cette situation il faut n'utiliser ``auto`` que si une template est souhaitée.
{: .block-warning }

> Notez aussi que les deux paramètres de ``auto sum(auto lhs, auto rhs) -> auto`` auront chacun leur propre type template.<br>
> Ils ne partageront pas un type template commun.<br>
> Ca équivaut à ``template<class T1, class T2> auto sum(T1 lhs, T2 rhs) -> auto``<br>
> Pas à: ``template<class T> auto sum(T lhs, T rhs) -> auto``
{: .block-warning }

Comme avec les templates, il est toujours possible de faire des *variadic template* avec ``auto``:

{% highlight cpp %}
auto sum(auto... types) -> auto
{
	return (types + ...);
};
{% endhighlight %}

Lorsque templates et paramètres ``auto`` sont combinés, cela équivaut à avoir les types des paramètres ``auto`` après les templates:

{% highlight cpp %}
template<class Lhs>
void sum(Lhs lhs, auto rhs);
{% endhighlight %}

Equivaut à:

{% highlight cpp %}
template<class Lhs, class Rhs>
void sum(Lhs lhs, Rhs rhs);
{% endhighlight %}

### try-catch ne supporte pas ``auto``

Bien que la syntaxe d'un ``catch`` puisse le laisser penser, un try-catch block **n'est pas une fonction**.<br>
Il n'est pas possible de templater le paramètre d'un ``catch``.<br>
De la même manière, il n'est pas possible d'utiliser ``auto`` pour typer ce paramètre.

{% highlight cpp linenos highlight_lines="5" %}
try
{
	// ...
}
catch (const auto& exception) // error: 'auto' not allowed in exception declaration
{
	std::cout << exception.what();
}
{% endhighlight %}

## auto cast (depuis C++23)

Une manière générique d'obtenir la copie d'un objet en C++ est ``auto variable = x;``, mais une telle copie est une [lvalue](/articles/c++/value_categories#lvalue).

``auto(a)`` (ou ``auto{x}``) permet d'en obtenir une copie sous forme de [prvalue](/articles/c++/value_categories#prvalue), ce qui peut être utile pour transmettre cet objet en paramètre à une fonction.

{% highlight cpp %}
function(auto(expr));
function(auto{expr});
{% endhighlight %}

## Structured binding pack (depuis C++26)

Dans la continuité des [structured binding declaration](#structured-binding-declaration-depuis-c17), le C++26 ajoute la possibilité de d'extraire des éléments dans un pack ([proposal](https://wg21.link/P1061R10), [approval](https://wg21.link/P1061R9)).

{% wip %}

---

Aller plus loin:
- [Literals](/articles/c++/literals)
- [Initialisation uniforme](/articles/c++/uniform_initialization)
- [Templates](/articles/c++/templates)
