---
layout: article
title: Évolution du mot clef auto
permalink: articles/c++/auto
category: c++
logo: c++.svg
background: corridor0.webp
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
A partir de cette version, le mot clef ``auto`` se voit attribuer une autre signification pour faire de l'**inférence de types**.

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

Cette écriture permet entre autre de définir un type de retour qui dépend des arguments de la fonction.

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
auto sum = (int lhs, int rhs) -> int {
	return lhs + rhs;
};
{% endhighlight %}

A noter qu'ici, ``auto`` n'est pas le type de la valeur de retour de la lambda, mais le type de la lambda elle-même.<br>
On en a parlé dans le [précédent point](#placeholder-type-specifiers-depuis-c11).

> En résumé, utiliser ``auto`` avec le trailing return type permet d'**uniformiser** la manière dont les types de retour sont déclarés et assure une meilleure lisibilité, surtout dans les fonctions dont le type de retour dépend des paramètres.<br>
> Cette pratique est **recommandée en C++ moderne**.

## ``auto`` as a return type (depuis C++14)

A partir de C++14, on peut laisser le compilateur déduire le type de retour à partir du ``return`` de la fonction, en le ne renseignant plus explicitement:

{% highlight cpp %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs)
{
	return lhs + rhs;
};
{% endhighlight %}

Cependant, ce n'est pas une écriture que vous verrez couramment car elle comporte des risques et qu'elle ne peut pas toujours s'appliquer.

Déjà, retourner ``auto`` est suffisant dans les définitions, mais pas dans les déclarations car elles n'ont pas accès au corps de la fonction pour déduire son type de retour.

Sum.h
{% highlight cpp %}
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

> Attention, les **conversions implicites** sont à éviter (mauvaise pratique). Le code précédemment n'est là qu'a des fins de démonstration pour montrer les problèmes que l'on peut rencontrer avec le *auto as a return type*
{: .block-warning }

Notez qu'il est possible de retourner ``auto`` en suivant le *trailing return type* pour respecter l'uniformisation:

{% highlight cpp %}
template<class Lhs, class Rhs>
auto sum(Lhs lhs, Rhs rhs) -> auto
{
	return lhs + rhs;
};
{% endhighlight %}

Ici, il n'y a pas de redondance du mot clef ``auto``.
Seul celui à droite désigne le type de retour de la fonction.

> Ici, il n'y a aucun intérêt autre que l'uniformisation d'écrire ``-> auto``.<br>
> Ecrire simplement ``auto sum(Lhs lhs, Rhs rhs)`` revient au même.

## ``decltype(auto)`` (depuis C++14)

Contrairement à ``auto``, ``decltype(auto)`` permet de préserver les propriétés cvref (``const``/``volatile``/``reference``) d'une expression.

``decltype(auto)`` est particulièrement utile lorsqu'il est nécessaire de préserver la nature exacte de l'expression retournée, que ce soit une référence ou un type const:

{% highlight cpp %}
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
{% highlight cpp %}
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

## Structured binding declaration (depuis C++17)

Les *structured binding declaration* permettent de décomposer les valeurs d'une structure/classe ou d'un tableau.

Structure ou classe:
{% highlight cpp linenos mark_lines="10" %}
struct Position2d
{
	int x;
	int y;
};

auto main() -> int
{
	auto position = Position2d{10, 15};
	auto [x, y] = position;
	
	std::print("{} {}\n", x, y);
}
{% endhighlight %}

> La destructuration doit **respecter l'ordre des paramètres**.<br>
> Leur nom n'a pas d'importance, il peut être changé. Par exemple: ``auto [foo, bar] = position;``

Tableau:
{% highlight cpp linenos mark_lines="6" %}
auto main() -> int
{
	int position[2];
	position[0] = 10;
	position[1] = 15;
	auto [x, y] = position;
	
	std::print("{} {}\n", x, y);
}
{% endhighlight %}

> Notez que cette écriture c-like des tableaux est à éviter en C++. Préférez l'utilisation de ``std::array``.

{% highlight cpp linenos mark_lines="6" %}
auto main() -> int
{
	auto position = std::array<int>{10, 15};
	auto [x, y] = position;
	
	std::print("{} {}\n", x, y);
}
{% endhighlight %}

Les *structured binding declarations* supportent les propriétés *cvref*, permettant de modifier les données contenues dans le conteneur, ou d'éviter des copies:

{% highlight cpp linenos mark_lines="13" %}
struct Person
{
	std::string firstName;
	std::string lastName;
};

auto main() -> int
{
	auto person = Person{
		.firstName = "Bjarne",
		.lastName = "Stroustrup"
	};
	const auto& [firstName, lastName] = person;
	
	std::print("{} {}\n", firstName, lastName);
}
{% endhighlight %}

Certains conteneurs de la STL supportent les *structured binding declarations*:

``std::pair``:
{% highlight cpp mark_lines="2" %}
auto pair = std::pair{1, 2};
auto [number1, number2] = pair;
std::print("{} {}", number1, number2);
{% endhighlight %}

``std::tuple``:
{% highlight cpp mark_lines="3" %}
using namespace std::literals;
auto pair = std::tuple{1, 2.2, "text"sv};
auto [integer, decimal, string] = pair;
std::print("{} {} {}", integer, decimal, string);
{% endhighlight %}

> Dans une *structured binding declaration*, chaque variable peut avoir un type différent.

``std::array``:
{% highlight cpp mark_lines="2" %}
auto pair = std::array{1, 2};
auto [number1, number2] = pair;
std::print("{} {}", number1, number2);
{% endhighlight %}

Grace à ``std::pair`` il est possible d'obtenir les clefs et valeurs dans une *range-based for loop* sur une ``std::map``/``std::unordered_map``.

{% highlight cpp mark_lines="5" %}
using namespace std::literals;
auto map = std::unordered_map{
	std::pair{ "key1"sv, "value1"sv }
};
for (const auto& [key, value] : map)
	std::print("{} {}", key, value);
{% endhighlight %}

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
constexpr auto const IntConstant42 = constant<42>;
{% endhighlight %}

Pour plus de généricité, il est également possible de le définir avec ``auto`` (``template<auto>``).
Ici, ``auto`` sert à indiquer une valeur en template qui sera déduite à l'instantiation.

{% highlight cpp %}
template<auto value>
constexpr auto constant = value;
constexpr auto const IntConstant42 = constant<42>;
{% endhighlight %}

Equivaut à:

{% highlight cpp %}
template<class Type, Type value>
constexpr Type constant = value;
constexpr auto const IntConstant42 = constant<int, 42>;
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

> Notez aussi que les deux arguments de ``auto sum(auto lhs, auto rhs) -> auto`` auront chacun leur propre type template.<br>
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

## auto cast (depuis C++23)

Une manière générique d'obtenir la copie d'un objet en C++ est ``auto variable = x;``, mais une telle copie est une [lvalue](/articles/c++/value_categories#lvalue).

``auto(a)`` (ou ``auto{x}``) permet d'en obtenir une copie sous forme de [prvalue](/articles/c++/value_categories#prvalue), ce qui peut être utile pour transmettre cet objet en paramètre à une fonction.

{% highlight cpp %}
function(auto(expr));
function(auto{expr});
{% endhighlight %}

## AAA (Almost Always Auto) (avant C++17)

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

Ceci explique le ``Almost`` dans ``Almost Always Auto``. On est passé à ça 🤏 d'avoir une règle d'écriture uniforme.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-i-believed-in-you.gif %}

Certains développeurs préfèrent utiliser ``auto`` avec parcimonie, en remplacement de types particulièrement verbeux (notamment les iterateurs).
D'autres prônent son utilisation quasi systématique, comme Scott Meyers et [Herb Sutter](https://herbsutter.com/2013/08/12/gotw-94-solution-aaa-style-almost-always-auto/).

Certains seraient même tentés de ne jamais utiliser ``auto`` pour éviter ce genre de problème, et passer à côté de tous les autres avantages qu'il apporte.

Mais c'est alors que...

## AA (Always Auto) (depuis C++17)

En C++17, le langage garanti la [copy elision](/articles/c++/copy_elision), faisant disparaitre les surcoûts que vous venons de voir, et rendant l'utilisation de ``auto`` possible même sur des types qui ne sont ni copyables, ni movables.

La [copy elision](/articles/c++/copy_elision) est une optimisation qui élimine la création et la copie d'objets temporaires ([prvalue](/articles/c++/value_categories#prvalue)). Au lieu de créer une copie intermédiaire, l'objet est directement construit à l'emplacement final.

Suite à ce changement dans le langage, Herb Sutter soutient le passage de AAA à AA.

A votre tour de prendre le pas et d'adopter ``auto`` dans vos projets.

{% gif /assets/images/articles/c++/almost_always_auto/person-of-interest-fusco.gif %}

---

Aller plus loin:
- [Literals](/articles/c++/literals)
- [Initialisation uniforme](/articles/c++/uniform_initialization)
- [Templates](/articles/c++/templates)
