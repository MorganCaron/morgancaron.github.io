---
layout: article
title: Les attributs (C++11)
permalink: articles/cpp/attributes
category: cpp
logo: cpp.svg
background: mountains1.jpg
seo:
  title: "Les attributs en C++"
  description: "Expliciter l'intention avec des attributs pour guider le compilateur et les autres développeurs, optimiser le programme et prévenir les bugs."
published: true
---

Les attributs, des informations **à destination du compilateur et du programmeur** qui **disparaissent** à la compilation.

## Qu'est-ce qu'un attribut ?

Les attributs sont des **métadonnées standardisées** ([syntaxe](#syntaxe-et-placement): ``[[attribute]]``) servant de **directives ou d'indices pour le compilateur** (pour **optimiser** le binaire final ou lever des **warnings** ciblés) et d'**indications pour les développeurs**.

Définir une variable, une fonction ou un type n'est parfois **pas suffisant**. On souhaiterait préciser qu'une variable n'est **potentiellement pas utilisée** (sans que ce soit considéré comme une erreur), qu'une fonction est **obsolète** ou qu'il ne faut **pas ignorer la valeur retournée** par une fonction.

En somme, il s'agit d'expliciter une intention qui **n'altère pas la logique** pure de l'application mais qui **guide le compilateur** dans ses optimisations tout en apportant des **informations cruciales aux développeurs** quant à l'usage de nos variables, fonctions ou types.

## Historique

Avant l'arrivée des attributs (**en C++11**), chaque compilateur proposait sa propre manière de définir ces métadonnées, avec des syntaxes qui leur sont propres, **spécifiques** à chaque compilateur et **incompatibles** entre elles:

- **Microsoft (MSVC)** utilise le mot-clef [``__declspec(...)``](https://learn.microsoft.com/en-us/cpp/cpp/declspec).
  Exemples: [``align(N)``](https://learn.microsoft.com/en-us/cpp/cpp/align-cpp) (alignement), [``dllexport``/``dllimport``](https://learn.microsoft.com/en-us/cpp/cpp/dllexport-dllimport) (exportation/importation), [``novtable``](https://learn.microsoft.com/en-us/cpp/cpp/novtable) (optimisation désactivant la vtable).
- **GNU (GCC) et Clang** utilisent le mot-clef [``__attribute__((...))``](https://gcc.gnu.org/onlinedocs/gcc/Attributes.html).
  Exemples: [``packed``](https://gcc.gnu.org/onlinedocs/gcc/Common-Attributes.html#index-packed) (layout compact), [``always_inline``](https://gcc.gnu.org/onlinedocs/gcc/Common-Attributes.html#index-always_005finline) (force l'inlining), [``section("nom")``](https://gcc.gnu.org/onlinedocs/gcc/Common-Attributes.html#index-section) (voir [la liste complète](https://gcc.gnu.org/onlinedocs/gcc/Common-Attributes.html)).
- **IBM** possède également ses propres [attributs de types](https://www.ibm.com/docs/en/xl-c-and-cpp-aix/16.1.0?topic=declarations-type-attributes-extension) et [attributs de fonctions](https://www.ibm.com/docs/da/xl-c-and-cpp-aix/13.1.0?topic=functions-function-attributes-extension)[²](https://www.ibm.com/docs/en/xl-c-and-cpp-aix/16.1.0?topic=functions-function-attributes-extension).

Ces syntaxes alternatives et **non standard** posent **problème pour l'écriture de codes portables**. Une **écriture normalisée** a donc été ajoutée au standard depuis C++11, offrant aux compilateurs une manière **uniforme** de spécifier des attributs.

## Syntaxe et placement

La syntaxe standardisée utilise les doubles crochets: [``[[attribute]]``](https://en.cppreference.com/cpp/language/attributes). L'emplacement de l'attribut détermine l'entité sur laquelle il s'applique:

- **Sur une fonction**: ``[[attribute]] void fonction();`` s'applique à la déclaration de la fonction.
- **Sur une variable**: ``int variable [[attribute]];`` ou ``[[attribute]] int variable;`` s'applique à la variable.
- **Sur un type**: ``struct [[attribute]] Structure {};`` s'applique à la définition du type (et donc à toutes ses instances).
- **Sur une structure de contrôle**: ``if (condition) [[attribute]]``.
- **Sur un bloc**: ``[[attribute]] { ... }``.

> Les attributs ne doivent **pas être confondus avec les annotations** de métadonnées (comme ``[[=serialisable]]``), introduites en C++26 pour la réflexion statique. Bien que partageant **la même syntaxe de doubles crochets**, les annotations ne guident pas le compilateur et sont traitées séparément. Pour plus de détails, consultez l'article sur la [reflection et les metaclasses](/articles/cpp/metaclasses).
{: .block-warning }

### Namespaces (Depuis C++11)

Le standard (depuis C++11) permet d'organiser les attributs au sein de **namespaces**. Cela permet d'une part d'**identifier clairement l'autorité ou le fournisseur** (compilateur, outil d'analyse statique...) qui définit et prend en charge l'attribut, et d'autre part d'**éviter les collisions de noms** entre les attributs standards et ces extensions spécifiques.

- **Les attributs standards** (comme `[[nodiscard]]` ou `[[deprecated]]`) sont placés dans le namespace global et **s'écrivent sans préfixe**.
- **Les attributs spécifiques** à un compilateur ou à un outil (comme `[[gnu::always_inline]]`, `[[msvc::no_unique_address]]` ou `[[clang::fallthrough]]`) sont préfixés par le namespace correspondant au fournisseur.

> **Attention à la confusion**: Ces namespaces, bien qu'ayant une **syntaxe** (``::``) et un **rôle similaire** aux [**namespaces classiques du C++**](/articles/cpp/scopes#namespace), ces namespaces sont **totalement indépendants** et n'ont **rien à voir** l'un avec l'autre. Ils sont traités à part par le compilateur et n'interviennent pas dans la résolution de portée de vos variables ou fonctions.
{: .block-warning }

> Cet article n'a **pas vocation à détailler** l'intégralité des **attributs non-standards** (à l'exception de quelques extensions majeures comme `[[clang::lifetimebound]]` abordé en fin d'article). Je vous laisse vous référer aux liens [ci-dessus](#historique) et faire **vos propres recherches** pour le reste. En revanche, nous aborderons bien **l'ensemble des attributs standards**.

#### Factorisation (Depuis C++17)

Il est possible de **déclarer plusieurs attributs** au sein d'une même paire de doubles crochets en les séparant par des virgules (par exemple ``[[attribut1, attribut2]]``).

Lorsque vous utilisez plusieurs attributs provenant d'un même [namespace](#namespaces-depuis-c11), répéter le préfixe pour chaque attribut peut être laborieux:

{% highlight cpp %}
[[gnu::always_inline, gnu::hot, gnu::const]] void function();
{% endhighlight %}

C++17 introduit la syntaxe ``using`` au début de la liste d'attributs pour spécifier un namespace commun à appliquer à tous les attributs de la liste:

{% highlight cpp %}
[[using gnu : always_inline, hot, const]] void function();
{% endhighlight %}

> **Si un ``using`` est présent** au début d'un spécificateur d'attribut, **aucun autre attribut de cette liste ne peut spécifier de namespace**.<br>
> Par exemple, combiner ``using`` et un attribut préfixé comme dans ``[[using CC: CC::opt(1)]]`` provoque une **erreur de compilation**.<br>
> Si vous devez mélanger des attributs de **différents namespaces** ou des attributs standards sans namespace, vous devez utiliser des **séquences d'attributs distinctes**: ``[[using gnu : always_inline, hot]] [[nodiscard]]``.
{: .block-warning }

### Positionnement dans les lambdas (Depuis C++11 / C++23)

Le positionnement des attributs dans une lambda **dépend de la version du standard et de la cible de l'attribut** ([cppreference](https://en.cppreference.com/cpp/language/lambda)):

[captures] &lt;tparams&gt;<sup>(optional)</sup> t-requires<sup>(optional)</sup> **front-attr**<sup>(optional)</sup> (params) specs<sup>(optional)</sup> except<sup>(optional)</sup> **back-attr**<sup>(optional)</sup> trailing<sup>(optional)</sup> requires<sup>(optional)</sup> contract-specs<sup>(optional)</sup> { body }

- **Les ``back-attr`` (Depuis C++11)**: positionnés **après les paramètres** et les spécificateurs (comme ``mutable`` ou ``constexpr``) et les spécifications d'exceptions (comme ``noexcept``). Ces attributs s'appliquent au **type** de l'``operator()``.

	> Pour cette raison, il est **impossible d'utiliser des attributs comme `[[nodiscard]]` ou `[[deprecated]]`** à cet emplacement (ils s'appliquent à la fonction elle-même, pas à son type). Seul `[[noreturn]]` y était toléré par dérogation historique (bien que cela fût considéré comme un défaut de conception du standard).
	{: .block-warning }

- **Les ``front-attr`` (Depuis C++23)**: positionnés **après les captures** ``[...]`` (ou après les paramètres template ``<...>`` et ``requires`` si présents), ou plus simplement **juste avant les paramètres** de la lambda ([proposal](https://wg21.link/p2173r1)). Cet emplacement s'applique directement à **l'``operator()`` lui-même**. C'est ce nouvel emplacement qui permet d'appliquer proprement `[[nodiscard]]`, `[[deprecated]]` ou `[[noreturn]]` sur une lambda.

{% highlight cpp %}
// Avant C++23: Aucun moyen standard de marquer une lambda comme [[nodiscard]]
auto lambda0 = [] (int valeur) [[nodiscard]] { return valeur * 2; }; // Erreur de syntaxe

// Depuis C++23 (placement en front-attr, avant les paramètres)
auto lambda1 = [] [[nodiscard]] (int valeur) { return valeur * 2; };

// Depuis C++23 (placement de [[noreturn]] en front-attr):
auto lambda2 = [] [[noreturn]] () { throw std::runtime_error("Erreur"); };
{% endhighlight %}

## La règle d'ignorabilité

Les attributs obéissent à la [**règle d'ignorabilité** (*ignorability rule*)](https://wg21.link/P2552). Celle-ci **garantit** que l'ajout ou le retrait d'un attribut **ne doit jamais altérer la sémantique de conformité du programme** (c'est-à-dire que le code **doit compiler** et produire **le même résultat** fonctionnel, **avec ou sans l'attribut**). Et qu'un attribut **non reconnu** par le compilateur doit simplement être **ignoré**.

Cette règle s'applique de deux manières complémentaires:

- **Ignorabilité sémantique**: Le comportement d'un programme valide **ne doit pas dépendre de la présence ou de l'absence d'un attribut**. Même si le compilateur reconnait un attribut, **sa suppression ne doit pas casser le bon fonctionnement** logique de l'application. Ils ne servent qu'à ajouter des **sécurités (via des warnings)** ou des optimisations de **performances**.

- **Ignorabilité syntaxique (Depuis C++17)**: Les compilateurs sont tenus de **reconnaître la syntaxe globale** des attributs (``[[...]]``) même s'ils ne comprennent pas ce qu'il y a dedans. Avant C++17, un compilateur qui rencontrait un namespace propriétaire inconnu (comme ``[[gnu::always_inline]]`` compilé avec MSVC) **était autorisé à rejeter le code et à interrompre la compilation**. Depuis C++17 ([proposal](https://wg21.link/p0283r2)), le standard exige qu'un **attribut inconnu** (qu'il soit standard ou propriétaire avec namespace) soit **ignoré sans bloquer la compilation**. Cela **garantit la portabilité** du code source (bien que le compilateur conserve le droit d'émettre un warning pour tout attribut non reconnu).

### Compatibilité entre versions et compilateurs

Grâce à cette règle, vous pouvez tout à fait utiliser des attributs récents (qu'ils soient standards ou non) sans casser le build sur des configurations qui ne les supportent pas encore:

- Utiliser un **attribut standard récent** (comme [``[[assume]]``](#assumeexpression-c23) standardisé en C++23) ou un **attribut propriétaire** (comme [``[[clang::lifetimebound]]``](#lifetimebound-extension-clangmsvc)) sur un **compilateur plus ancien** ou configuré dans une norme précédente (comme C++11). N'étant **pas reconnu**, l'attribut sera simplement **ignoré** (le compilateur conservant le droit d'émettre un warning).

- Utiliser des **attributs** spécifiques à un compilateur (comme ``[[gnu::always_inline]]`` ou ``[[msvc::no_unique_address]]``) sur un autre compilateur (comme Clang compilant du code GCC, ou inversement). L'attribut propriétaire sera simplement **ignoré sans erreur** de build (et potentiellement avec un warning). Ceci **permet à chaque compilateur de proposer ses propres attributs spécifiques**, en plus de supporter les attributs standards en suivant une syntaxe uniforme.

### ``-Werror`` et warnings d'attributs inconnus

Comme nous venons de le voir, exploiter la [règle d'ignorabilité](#la-règle-dignorabilité) apporte des **avantages pour la portabilité** des projets d'un compilateur à un autre et d'une version du standard à une autre.

Mais le compilateur **peut émettre un warning pour signaler qu'il ne reconnaît pas un attribut**.<br>
Cela peut être utile pour **nous avertir d'une faute de frappe** (par exemple un ``[[nodiscar]]`` dans lequel on aurait **oublié** le ``d``).<br>
Mais en dehors de ce cas précis, ce warning est plus une **entrave à la portabilité** qu'un message utile.

De plus, si l'option de compilation **``-Werror``** est activée (flag de compilation **recommandé**, qui **transforme tout warning en erreur bloquante**), alors **le moindre warning d'attribut non reconnu bloquera la compilation**. Ce n'est **pas souhaitable**.

Pour cette raison, je recommande de désactiver systématiquement les warnings pour attributs inconnus avec le flag ``-Wno-unknown-attributes`` sur GCC/Clang, et ``/wd5030`` sur MSVC, afin de bénéficier pleinement de la [portabilité syntaxique de C++17](#la-règle-dignorabilité).

> **Une exception à la règle**
> D'une manière générale, désactiver des warnings de compilation est une **mauvaise pratique** qu'il faut **absolument éviter**. Cette recommandation constitue toutefois une **exception rationnelle**: le bénéfice apporté par la portabilité et l'écriture fluide d'attributs natifs l'emporte ici sur le compromis (le risque de faute de frappe, qui peut de toute façon être intercepté par des linters ou outils d'analyse statique).
{: .block-warning }

Une **approche alternative**, plus verbeuse, consiste à passer par des macros pour **vérifier le support de chaque attribut**:

### Détecter le support d'un attribut

Pour gérer finement la compatibilité et éviter les warnings sur les compilateurs ne supportant pas un attribut, le standard fournit la macro de préprocesseur ``__has_cpp_attribute(nom_attribut)``.

Introduite formellement dans le standard en C++20 ([**proposal**](https://wg21.link/p0941r2)), elle faisait déjà l'objet de recommandations depuis 2014 ([**SD-6** (*Standing Document 6*)](https://wg21.link/n4200)), ce qui explique sa présence et son support par Clang, GCC et MSVC bien avant C++20.

Elle renvoie une valeur entière non nulle (généralement la date de standardisation sous la forme ``AAAAMML``, avec "AAAA" pour l'année et "MM" pour le mois [suivi du literal ``L``](/articles/cpp/literals#integer-literal)) si l'attribut est supporté, ou ``0`` s'il ne l'est pas:

{% highlight cpp %}
#if __has_cpp_attribute(nodiscard)
#  define NODISCARD [[nodiscard]]
#else
#  define NODISCARD
#endif

NODISCARD int* getData();
{% endhighlight %}

> Cela fonctionne également pour tester le support des attributs propriétaires en incluant leur namespace (ex: ``__has_cpp_attribute(gnu::always_inline)``).

> Cette approche par macros présente toutefois des **inconvénients notables**. En C++, l'usage de **macros préprocesseur** est généralement considéré comme une **solution inélégante** (les macros étant **globales** et **dépourvues de typage**). Elles obligent à déclarer et importer ces définitions **presque partout** dans votre base de code. Cette mécanique est d'autant plus indésirable et "sale" dans un projet moderne exploitant [les modules (C++20)](/articles/cpp/modules).
>
> C'est pourquoi **je recommande** plutôt de s'affranchir de cette tuyauterie de macros en privilégiant [l'approche par **désactivation spécifique du warning**](#-werror-et-warnings-dattributs-inconnus) au niveau de votre compilateur.
{: .block-warning }

## Les attributs standards

Nous allons maintenant voir les différents attributs standards à connaitre (dans l'ordre de leur intégration au langage).

### ``[[noreturn]]`` (C++11)

Contrairement à ce que son nom peut laisser penser, cet attribut **ne veut pas dire que la fonction ne retourne rien** (``void``), mais qu'elle **ne retourne pas**, c'est-à-dire que la fonction **ne se termine pas de manière conventionnelle** (en atteignant la **fin de son scope** ou en atteignant un **``return``**).<br>
Concrètement, l'attribut ``[[noreturn]]`` informe le compilateur qu'une fonction **ne rend jamais la main à son appelant**.

Il est utilisé **pour les fonctions qui terminent le programme** (``std::exit``, ``std::abort``), qui **lèvent systématiquement des exceptions** ou qui contiennent des **boucles infinies**.

En garantissant qu'aucun flux d'exécution ne sortira de la fonction, il permet au compilateur de considérer tout code situé après l'appel comme du **code mort**, **supprimant ainsi les warnings** sur les chemins de retour manquants et **autorisant des optimisations de branchement agressives**.

{% highlight cpp linenos highlight_lines="1 7 12" %}
[[noreturn]] void fatalError(std::string_view message)
{
	std::cerr << message << std::endl;
	std::abort();
}

int selectValue(int option)
{
	switch(option)
	{
	case 1: return 42;
	case 2: return 100;
	default: fatalError("Option inconnue!");
	}
}
{% endhighlight %}

Sans ``[[noreturn]]`` sur ``fatalError()``, le compilateur **lèverait ici un warning** car **la branche default ne retourne rien**:<br>
- "*control reaches end of non-void function*" sur GCC
- "*non-void function does not return a value in all control paths*" sur Clang

> Attention, si une fonction marquée ``[[noreturn]]`` finit par **retourner normalement**, le comportement est **indéfini (UB)**.
{: .block-warning }

### ``[[carries_dependency]]`` (C++11, retiré en C++26)

Cet attribut est l'**un des plus complexes** du standard. Son objectif était de **propager les dépendances à travers les appels de fonctions** afin de permettre des **optimisations de synchronisation** sur certaines architectures.<br>
Il est **exclusivement lié** au modèle mémoire **release-consume** (``std::memory_order_consume``) utilisé **en programmation multithreadée bas niveau**.

Il faut bien distinguer le fait que c'est le modèle mémoire ``std::memory_order_consume`` qui apporte des optimisations, et non ``[[carries_dependency]]``. Cet attribut sert uniquement à **apporter des garanties de propagation de dépendances entre fonctions**.
Nous allons détailler ce que ça signifie.

#### Le modèle Release-Consume

Pour comprendre cet attribut, il faut d'abord comprendre le modèle de mémoire [**Release-Consume**](https://en.cppreference.com/cpp/atomic/memory_order#Release-Consume_ordering).

Sur des architectures matérielles [faiblement ordonnées](https://en.wikipedia.org/wiki/Weak_ordering) comme [ARM ou PowerPC](https://en.cppreference.com/cpp/atomic/memory_order#Explanation), **le compilateur** (lors de l'optimisation du code à la compilation) ou **le processeur** (au runtime pour maximiser l'efficacité du pipeline) peuvent agressivement **réordonner** l'ordre des accès mémoire.

{% row %}
{% highlight cpp %}
// Ordre logique (écrit par le développeur)
data = 42;
ready = true;
{% endhighlight %}

{% highlight cpp %}
// Ordre d'exécution (réordonné par le compilateur ou le CPU)
ready = true;
data = 42;
{% endhighlight %}
{% endrow %}

> Dans un programme mono-threadé ([comme en langage C](https://en.cppreference.com/c/language/as_if)), le compilateur et le CPU fonctionnent sous le principe de la **règle du [*"as-if"*](https://en.cppreference.com/cpp/language/as_if)** ("comme si"):<br>
> Ils **ont le droit de réordonner toutes les instructions** pour gagner en performance, **tant que le comportement final** effectué sur ce thread **reste identique** à une exécution séquentielle, ligne par ligne.
>
> **Note sur le multithreading**: Historiquement, cette règle a été conçue avec l'hypothèse d'une exécution à un seul thread.<br>
> Avec l'introduction d'un [modèle de mémoire formel en C++11](https://en.cppreference.com/cpp/atomic/memory_order) (et [C11](https://en.cppreference.com/c/atomic/memory_order)), les limites du *as-if* ont été redéfinies. Le compilateur et le CPU conservent leur liberté d'optimisation, mais celle-ci est désormais contrainte: elle ne doit jamais introduire de data races ni altérer l'ordre d'accès requis par les mécanismes de synchronisation et les opérations atomiques (comme `std::memory_order`).
>
> Dans l'exemple ci-dessus, puisque `data` et `ready` sont **indépendantes**, intervertir leur écriture n'a **aucun impact pour le thread** qui exécute ce code. C'est uniquement lorsque **d'autres threads** lisent ces variables en parallèle que **le réordonnancement provoque un bug**.

#### Quand le réordonnancement est impossible: La dépendance de données

Il existe des cas où le compilateur et le processeur **n'ont pas le droit de réordonner** deux instructions, même pour optimiser les performances: lorsque la seconde instruction **dépend directement** du résultat de la première.

{% highlight cpp %}
auto x = 10;
auto y = x + 5; // Impossible à réordonner. y dépend de x
{% endhighlight %}

Puisque le calcul de ``y`` nécessite la valeur de ``x``, le CPU et le compilateur sont forcés d'exécuter l'initialisation de ``x`` en premier. C'est ce qu'on appelle une **dépendance de données**. C'est important de connaitre ce terme pour la suite.

#### Le matériel et la dépendance de données

Sur [ARM](https://developer.arm.com/documentation/102336/latest/) et [PowerPC](https://www.kernel.org/doc/Documentation/memory-barriers.txt), cette garantie de dépendance de données s'applique au niveau matériel, y compris pour les accès mémoire via des pointeurs. Si vous lisez un pointeur puis lisez une valeur pointée par ce pointeur, le processeur garantit naturellement l'ordre des lectures sans barrière mémoire.

Imaginons le scénario d'une liste chaînée partagée entre deux threads:
{% highlight cpp linenos %}
struct Node
{
	int value;
	Node* next;
};
std::atomic<Node*> head = nullptr;

// Thread A (Producteur)
Node* node = new Node{42, nullptr};
head.store(node, std::memory_order_release); // Publie le noeud

// Thread B (Consommateur)
Node* node = head.load(std::memory_order_consume); // Charge le pointeur
if (node)
{
	auto value = node->value; // Accès dépendant!
}
{% endhighlight %}

Ici, l'accès à ``node->value`` nécessite de connaître la valeur de ``node``. Il y a une [dépendance de données](https://en.cppreference.com/cpp/atomic/memory_order#Release-Consume_ordering) évidente (on appelle cela une *address dependency*). Sur ARM et PowerPC, le processeur garantit que ``node`` sera lu avant ``node->value`` (et pas réordonné avant).

> Mais le point que je voudrais soulever ici n'est pas simplement: "lire ``node`` avant ``node->value``".<br>
> Ca, tous les processeurs le font.<br>
>
> La propriété importante ici est que **les écritures publiées** avec un ``store(release)`` **deviennent visibles** lors d'un chargement dépendant (``load(consume)``).<br>
> Grâce à cette dépendance d'adresse, ARM et PowerPC garantissent que ``node->value`` **verra bien les écritures publiées avant le ``store(release)``** (donc l'affectation de la valeur ``42``).

> Avec ``std::memory_order_acquire``, le compilateur peut **insérer une barrière matérielle** (comme une instruction [``LDAR``](https://developer.arm.com/documentation/102336/0101/Load-Acquire-and-Store-Release-instructions) sur ARMv8, ou [``DMB``](https://developer.arm.com/documentation/102336/0101/Data-Memory-Barrier) sur ARMv7) garantissant que toutes les écritures publiées avant un ``store(release)`` soient visibles après le chargement.<br>
> Cette synchronisation **peut réduire les possibilités d'optimisation** du processeur et **entraîner un coût** en performances.<br>
> ``std::memory_order_consume`` avait précisément pour objectif d'**éviter cette synchronisation explicite** en s'appuyant uniquement sur les dépendances d'adresse déjà garanties par le matériel. En pratique, cette approche s'est révélée **trop complexe à implémenter** correctement dans les compilateurs, qui [traitent aujourd'hui presque tous les ``consume`` comme des ``acquire``](#pourquoi-a-t-il-été-retiré-en-c26-).
{: .block-warning }

#### Le problème des frontières de fonctions

Le compilateur sait suivre cette chaîne de dépendances **à l'intérieur d'une même fonction**. Cependant, dès que le pointeur est passé à une autre fonction **définie dans une autre translation unit** (par exemple, une bibliothèque compilée), le compilateur fait face à une opacité totale:

{% highlight cpp %}
// myLibrary.h
// Fonction définie dans un autre fichier, le compilateur n'a pas accès à son code
auto readValue(Node* node) -> int;

// myProject.cpp
// Opacité: le compilateur ne sait pas si la fonction préserve la dépendance.
// Dans le doute, il doit insérer une barrière acquire (comportement équivalent à std::memory_order_acquire).
auto value = readValue(node);
{% endhighlight %}

Afin de garantir la correction du code, le compilateur est contraint de générer une barrière mémoire d'acquisition avant l'appel de fonction, détruisant tout le gain de performance du modèle ``consume``.

#### La solution: ``[[carries_dependency]]``

L'attribut ``[[carries_dependency]]`` permet d'indiquer explicitement au compilateur que l'on souhaite [propager la dépendance de données](https://en.cppreference.com/cpp/atomic/memory_order#Release-Consume_ordering) à travers les frontières d'appels de fonctions:
- **Sur un paramètre**: Il promet au compilateur que la fonction utilisera cet argument d'une manière qui préserve la dépendance matérielle.
- **Sur le retour de la fonction**: Il promet que le pointeur retourné propage la dépendance vers l'appelant.

Voici un exemple d'usage classique pour une fonction de parcours dans une liste chaînée:
{% highlight cpp %}
struct Node
{
	int value;
	Node* next;
};

// Indique que la dépendance portée par 'current' entre dans la fonction,
// et que le pointeur retourné propage également cette dépendance chez l'appelant.
[[carries_dependency]] Node* getNext(Node* current [[carries_dependency]])
{
	return current->next;
}
{% endhighlight %}

Grâce à cette déclaration, le compilateur sait qu'il peut compiler l'appel de fonction **sans insérer de barrière mémoire** intermédiaire.

#### Pourquoi a-t-il été retiré en C++26 ?

En pratique, l'analyse statique des dépendances de données à travers les optimiseurs s'est révélée d'une complexité insurmontable pour les concepteurs de compilateurs. Suivre précisément le graphe d'instructions sans interrompre la dépendance (ce qui arrive par exemple si un pointeur est converti en entier puis restauré) s'est avéré trop instable.

C'est pourquoi, depuis l'introduction de cette mécanique en C++11, la totalité des compilateurs modernes (GCC, Clang, MSVC) ont choisi de ne pas suivre ces chaînes de dépendances: le modèle ``consume`` y est silencieusement promu en [modèle mémoire ``acquire``](https://en.cppreference.com/cpp/atomic/memory_order), et l'attribut ``[[carries_dependency]]`` y est tout simplement [ignoré](https://en.cppreference.com/cpp/atomic/memory_order#Release-Consume_ordering).

Puisque cet attribut n'était plus qu'une coquille vide jamais implémentée de manière effective, le comité du C++ a officiellement voté sa suppression de la norme C++26 ([**proposal**](https://wg21.link/p2738r1)).

Bien que cet attribut ait été supprimé, son étude reste intéressante pour comprendre le fonctionnement sous-jacent du modèle de mémoire du C++.

### ``[[deprecated]]`` et ``[[deprecated("explanation")]]`` (C++14)

Marque une entité comme obsolète. L'impact est un warning lors de chaque utilisation.

{% highlight cpp linenos %}
// Sur une fonction ou méthode
[[deprecated("Use newFunction() instead.")]]
void oldFunction();

// Sur une classe, structure ou union
struct [[deprecated("Cette structure sera supprimée en v2.0.")]] OldStruct
{
	int x;
};

// Sur un namespace
namespace [[deprecated("Use NewNamespace instead.")]] OldNamespace
{
	void f();
}

// Sur une variable
[[deprecated]] inline int oldVariable = 42;

// Sur un alias
using OldAlias [[deprecated("Use NewAlias instead.")]] = int;

// Sur une valeur d'enum
enum class Statut
{
	Ok,
	Ko,
	[[deprecated("Use Ko instead.")]] Unknown
};
{% endhighlight %}

- **``-Wno-deprecated-declarations``** (ou **``/wd4996``** sur MSVC): **ignore les warnings** liés aux entités dépréciées (déconseillé, car **retire l'intérêt préventif** de l'attribut ``[[deprecated]]``).
  > **Note sur le warning C4996 (MSVC)**
  > Le warning [``C4996``](https://learn.microsoft.com/fr-fr/cpp/error-messages/compiler-warnings/compiler-warning-level-3-c4996?view=msvc-170) de MSVC est utilisé à la fois pour signaler l'usage d'entités dépréciées par ``[[deprecated]]`` et pour les fonctions de la bibliothèque standard (ou POSIX) jugées "non sécurisées" par Microsoft (ex: ``strcpy``, ``fopen``). Activer ``/wd4996`` masquera donc également ces alertes de sécurité de la bibliothèque standard.
  {: .block-warning }
- **``-Wno-error=deprecated-declarations``**: empêche les warnings de dépréciation de bloquer la compilation sous ``-Werror``. **Je le recommande fortement** dans tous les projets.
  > ⚠️ **Comportement avec MSVC**
  > Microsoft Visual C++ ne possède pas d'équivalent direct à ``-Wno-error=`` pour exempter un warning spécifique de l'effet global de [``/WX`` (warnings as errors)](https://learn.microsoft.com/fr-fr/cpp/build/reference/wx-treat-linker-warnings-as-errors?view=msvc-170). Si vous utilisez MSVC avec ``/WX``, vous devez soit accepter que les warnings de dépréciation bloquent la compilation, soit désactiver complètement le warning globalement avec ``/wd4996`` (ou localement par pragma).
  {: .block-warning }

> **Astuce de migration**: Si votre projet utilise le flag **``-Werror``**, vous pouvez utiliser ``-Wno-error=deprecated-declarations`` (GCC/Clang) pour **maintenir ces warnings** au stade de simples messages **sans bloquer la compilation**, laissant ainsi le temps aux développeurs de **migrer progressivement**.

### ``[[nodiscard]]`` (C++17) et ``[[nodiscard("explanation")]]`` (C++20)

L'attribut ``[[nodiscard]]`` impose une contrainte de traitement sur la valeur de retour. Il s'utilise sur les fonctions dont la valeur de retour ne doit pas être ignorée. Il peut s'appliquer également sur des types, auquel cas il s'applique automatiquement à toutes les fonctions retournant ce type.

{% highlight cpp linenos %}
// Sur une fonction ou méthode
[[nodiscard]] int* getData();

// Sur une classe ou structure (toute fonction retournant ce type hérite de nodiscard)
struct [[nodiscard]] ErrorCode
{
	int code;
};
ErrorCode getStatus(); // L'appelant doit récupérer la structure retournée

// Sur un constructeur (Depuis C++20)
struct Lock
{
	[[nodiscard("Ressource RAII: doit être stockée dans une variable pour être active")]]
	explicit Lock(std::mutex& m);
};
// Appeler Lock(m); (temporaire détruit immédiatement) lèvera un warning
{% endhighlight %}

Ainsi il est possible d'exprimer au développeur appelant une fonction (et au compilateur) qu'ignorer la valeur retournée par celle-ci constitue une erreur de logique, une mauvaise utilisation de la fonction (code d'erreur important ignoré, ou gestion de ressources RAII non-exploitée).

#### Prévention des fuites mémoire (RAII non exploité)

Ici, la fonction alloue une ressource et en transfère la propriété à l'appelant. Si la valeur de retour est ignorée, la seule référence à la ressource allouée est perdue, ce qui provoque immédiatement une fuite de mémoire:

{% highlight cpp linenos highlight_lines="1" %}
[[nodiscard]] auto makeData() -> int*
{
	return new int{42}; // Allocation dynamique
}

auto main() -> int
{
	makeData(); // Warning du compilateur: le pointeur retourné est perdu, provoquant une fuite de mémoire
}
{% endhighlight %}

#### Erreur de logique ou fonction sans effet de bord

Si une fonction a pour unique rôle de renvoyer une valeur calculée ou d'inspecter l'état d'un objet (comme un getter, ou une fonction pure comme `std::vector::empty()`), l'appeler sans exploiter son retour constitue une erreur de logique évidente puisqu'aucun effet de bord n'est produit par l'appel:

{% highlight cpp linenos highlight_lines="1" %}
[[nodiscard]] auto getNumber() -> int
{
	return 42; // Le seul intérêt de la fonction réside dans sa valeur de retour
}

auto main() -> int
{
	getNumber(); // Warning du compilateur: le résultat du calcul est jeté inutilement
}
{% endhighlight %}

> L'attribut ``[[nodiscard]]`` n'a de sens que si la fonction retourne une valeur. L'appliquer sur une fonction qui retourne ``void`` peut produire un warning (ou une erreur, si ``-Werror`` est activé) de la part du compilateur (ex: ``error: attribute 'nodiscard' cannot be applied to functions without return value``).
{: .block-warning }

> **Message d'explication personnalisé (Depuis C++20)**
> Il est possible d'associer un message explicatif en argument de l'attribut (ex : `[[nodiscard("Raison")]]`). Ce texte sera alors affiché par le compilateur au sein du warning afin de clarifier la raison pour laquelle la valeur de retour ne doit pas être ignorée.

#### Applications étendues dans libc++ (LLVM)

L'implémentation de la bibliothèque standard par LLVM, **libc++**, adopte une politique très proactive vis-à-vis de ``[[nodiscard]]``. Elle applique cet attribut de manière beaucoup plus large que ce qui est strictement exigé par la norme C++.

Par exemple, [``std::vector::empty()``](https://fr.cppreference.com/cpp/container/vector/empty) n'est pas officiellement ``[[nodiscard]]`` mais LLVM a décidé de [lui appliquer quand même cet attribut dans la **libc++**](https://github.com/llvm/llvm-project/blob/f6b50ceeca020729445239b5375343e909d3dc51/libcxx/include/__vector/vector.h#L402-L404).

> Notez que c'est également le cas d'un certain nombre de fonctions similaires autour de cette portion de leur code (``begin``, ``end``, ``size``, ``capacity``, etc). Les fonctions y sont précédées d'un ``[[__nodiscard__]]`` non standard.
>
> J'ai essayé de remonter la source de ce ``__nodiscard__`` pour savoir si c'est une macro définie comme ``#define __nodiscard__ nodiscard`` sous certaines conditions. Mais mes recherches s'avèrent sans succès, je n'ai pas trouvé de déclaration. C'est donc probablement un **attribut propriétaire** reconnu directement par Clang.

LLVM a **pris la liberté** de ce choix pour **détecter les bugs fréquents** liés à des **oublis** pour les appels qui n'ont à priori **pas de sens d'être appelés en étant ignorés**. Ce n'est donc **pas une mauvaise chose**.

Mais ça peut surprendre, notamment dans le cas de ``std::unexpected``. Il m'est personnellement arrivé de **vouloir en ignorer** dans le cadre de tests unitaires très précis. J'ai donc dû trouver une [**alternative** pour ignorer la valeur de retour](#ignorer-un-nodiscard).

A noter que c'est aussi le cas des **constructeurs de [``std::unique_lock``](https://github.com/llvm/llvm-project/blob/9942a38e64b2333dc3816eebe6ac9230b1993220/libcxx/include/__mutex/unique_lock.h#L41-L63)**.

> Si vous souhaitez **désactiver cette liberté** prise par LLVM, il est possible d'agir dessus en définissant une ou plusieurs des macros suivantes (à définir avant l'inclusion des headers standards):
>
> - [**``_LIBCPP_ENABLE_NODISCARD``**](https://releases.llvm.org/12.0.1/projects/libcxx/docs/UsingLibcxx.html#libc-configuration-macros): Active les **applications étendues** de ``[[nodiscard]]`` par la libc++ sur les éléments non spécifiés (inclut à la fois les extensions propres à la libc++ et le **rétroportage** de ``[[nodiscard]]`` issus de standards plus récents).
> - [**``_LIBCPP_DISABLE_NODISCARD_EXT``**](https://releases.llvm.org/12.0.1/projects/libcxx/docs/UsingLibcxx.html#libc-configuration-macros): Désactive **uniquement les extensions** propres à la libc++, mais **conserve le rétroportage** de ``[[nodiscard]]`` issus de standards plus récents (comme le rétroportage de C++20 vers C++17).
> - [**``_LIBCPP_DISABLE_NODISCARD_AFTER_CXX17``**](https://releases.llvm.org/12.0.1/projects/libcxx/docs/UsingLibcxx.html#c-20-specific-configuration-macros): Désactive les warnings pour les éléments marqués ``[[nodiscard]]`` uniquement depuis les standards postérieurs à C++17.

#### Ignorer un ``[[nodiscard]]``

Il arrive parfois (rarement) qu'on veuille ignorer une valeur ``[[nodiscard]]`` retournée par une fonction (par exemple dans un test unitaire qui n'a pas besoin d'exploiter une donnée retournée).

Il existe 5 manières d'**ignorer explicitement** la valeur ``[[nodiscard]]`` retournée par une fonction, et faire taire volontairement le warning du compilateur:

- ``(void)function();``: Cast C en ``void``. Les casts C sont **fortement déconseillés en C++** (car il existe un équivalent C++ plus propre: le suivant dans cette liste);
- ``static_cast<void>(function());``: Cast C++ en ``void``. Très efficace, c'est **la seule manière propre de faire avant C++11**;
- ``std::ignore = function();``: L'utilitaire [``std::ignore`` (C++11)](https://en.cppreference.com/cpp/utility/tuple/ignore) apporte une solution plus explicite sur l'intention du développeur. Son utilisation ici est détournée, car initialement conçu pour [``std::tie``](https://en.cppreference.com/cpp/utility/tuple/tie) (``std::tie(std::ignore, result) = set.insert(value);``). ``std::ignore`` est un objet **proxy** utilisé pour ignorer une assignation. ``[[nodiscard]]`` n'est donc pas ignoré mais sa valeur retournée est **assignée à un objet proxy**. Retenez que ``std::ignore`` n'est **pas conçu pour ça** et que les compilateurs n'ont pas d'obligation stricte à adopter ce comportement;
- ``[[maybe_unused]] auto variable = function();``: N'ignore pas ``[[nodiscard]]`` mais permet de stocker le résultat dans une variable en la signalant comme non utilisée, sans que ce soit considéré comme une erreur par le compilateur. Voir la section sur [``[[maybe_unused]] (C++17)``](#maybe_unused-c17);
- ``auto _ = function();``: Les [**name-independent declarations** (C++26)](#name-independent-declaration-c26) permettent d'ignorer la valeur en déclarant une variable anonyme.

#### Name-independent declaration (C++26)

En C++26, le nom de variable ``_`` prend un **sens particulier**. Connu sous le nom "*[name-independent declaration](https://en.cppreference.com/cpp/language/conflicting_declarations#Multiple_declarations_of_the_same_entity)*" ou "*placeholder variable with no name*" (C++26) ([Proposal](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2023/p2169r4.pdf)), il permet d'**exprimer explicitement l'intention d'ignorer une valeur** (construite ou retournée par une fonction). Cette variable ne doit pas être utilisée comme une variable normale.

Les *name-independent declarations* peuvent **être déclarées** plusieurs fois dans le même scope:
{% highlight cpp %}
auto _ = foo();
auto _ = bar(); // OK depuis C++26 (pas avant)
{% endhighlight %}
**être utilisées** dans des *structured bindings* pour ignorer une ou plusieurs composantes:
{% highlight cpp %}
auto [x, _] = pair();
{% endhighlight %}
**être utilisées** dans l'init-capture des lambdas:
{% highlight cpp %}
[ _ = f() ]{};
{% endhighlight %}

> Attention, il ne s'agit pas d'un réel placeholder comme en Rust ([placeholder en assignation](https://doc.rust-lang.org/reference/expressions/underscore-expr.html) ou en tant que [pattern (wildcard)](https://doc.rust-lang.org/reference/patterns.html#wildcard-pattern)).<br>
> En C++, ``_`` est un pseudo-placeholder. Ca reste considéré comme un nom de variable.

{% highlight cpp %}
auto _ = foo();
bar(_); // valide syntaxiquement
auto x = _; // valide également
{% endhighlight %}

Cette "variable" n'est pas destinée à être utilisée. Et depuis C++26, le compilateur comprend l'intention d'ignorer la valeur, et accepte plusieurs variables portant ce nom dans un même scope.

Par exemple, le code suivant appelle bien le constructeur de l'objet retourné. Aucune optimisation n'est faite pour supprimer l'objet de la compilation:
{% highlight cpp %}
struct Foo
{
	Foo() { std::cout << "Foo{};" << std::endl; }
};

auto _ = Foo{};
{% endhighlight %}

**Son destructeur sera aussi appelé** automatiquement **à la fin du scope** de la variable ``_``. Et ce, même si plusieurs variables ``_`` coexistent dans le même scope.

Il en va de même pour les fonctions qui retournent un objet.

> A noter qu'utiliser une variable ``_`` comme une variable normale n'est pas UB en C++. Son comportement est défini mais est spécial, différent du comportement des variables normales:

Les déclarations sont sans identité nominale stable (name-independent):
{% highlight cpp %}
auto _ = 42;
auto x = _; // valide
{% endhighlight %}

**Les règles de conflits changent, plusieurs ``_`` peuvent exister sans collision**:
{% highlight cpp %}
auto _ = 1;
auto _ = 2;
auto x = _; // Erreur: ambiguïté/ill-formed (pas UB)
{% endhighlight %}

En bref, l'intention du standard est d'**en faire une variable utile pour ignorer des valeurs sans changer fondamentalement son fonctionnement**, tout en **déconseillant fortement son utilisation** après initialisation. Cette variable n'est **plus faite pour cela** depuis C++26.

### Le symbole ``_`` n'est **pas** spécial

Le nom ``_`` ne devient pas "spécial" en C++26. Il n'a pas de sémantique globale absolue.<br>
Il devient "spécial" **uniquement** s'il est utilisé dans une déclaration *name-independent* valide. Dans les autres cas, il reste un identifiant normal.

#### Cas global (non spécial)

Dans la portée d'un namespace (ce qui inclut le scope global), ``_`` reste un nom de variable classique. Il suit les règles normales de *linkage* et de déclaration.

{% highlight cpp %}
int _;
int _; // ❌ Erreur: redefinition of '_'
{% endhighlight %}

Aucun mécanisme *name-independent* ne s'applique ici. L'identifiant ``_`` subit un conflit de redéfinition comme n'importe quel autre nom.

#### Contraste avec le scope local (C++26)

Dans un scope local, le comportement est fondamentalement différent:

{% highlight cpp %}
auto _ = 1;
auto _ = 2; // OK depuis C++26
{% endhighlight %}

La différence réside dans le contexte:
- **Global scope**: ``_`` est un identifiant normal, les collisions sont interdites.
- **Local name-independent declaration**: ``_`` est une entité sans identité nominale stable, les collisions sont autorisées.

Ce n'est donc **pas** "le symbole ``_`` qui est spécial en C++26", mais plutôt "certaines déclarations portant le nom ``_`` qui sont traitées comme *name-independent*".

### ``[[maybe_unused]]`` (C++17)

Supprime les warnings liés aux entités déclarées mais non exploitées. Cet attribut peut être placé sur un objet, une fonction, une variable ou une lambda.

{% highlight cpp linenos %}
// Sur une classe ou structure
struct [[maybe_unused]] Status
{
	int code;
};

// Sur une fonction
[[maybe_unused]] void disableLogger()
{
	// Cette fonction n'est appelée nulle part, mais ne déclenchera pas de warning.
}

// Sur un argument de fonction
void process([[maybe_unused]] int option)
{
	// option n'est pas lue ici, mais aucun warning n'est émis.
}

// Sur une variable locale ou globale
[[maybe_unused]] auto debugMode = true;
{% endhighlight %}

Il est particulièrement utile dans du code générique (templates) où certains paramètres peuvent ne pas servir selon les cas d'utilisation.

{% highlight cpp %}
template<class ReturnType, class... Args, std::size_t... I>
[[nodiscard]] constexpr auto call([[maybe_unused]] std::span<std::byte> stack, ReturnType(*function)(Args...), [[maybe_unused]] std::index_sequence<I...> indexSequence) -> decltype(auto)
{
	[[maybe_unused]] auto arguments = std::make_tuple(get<std::remove_reference_t<Type::NthType<I, Args...>>>(stack, getPaddingAfterT<I, std::remove_reference_t<Args>...>())...);
	return std::invoke(function, std::forward<Args>(std::get<I>(arguments))...);
}
{% endhighlight %}

Avant C++17, on utilisait souvent le cast ``static_cast<void>(variable);`` pour faire taire le compilateur. Ou ``(void)variable;`` en C (avant C23, qui ajoute [``[[maybe_unused]]`` au langage C](https://en.cppreference.com/c/language/attributes/maybe_unused))

Depuis C++26, [**déclarer une variable avec le wildcard ``_``**](#name-independent-declaration) la rend implicitement ``[[maybe_unused]]``.

> **C++26 et le wildcard ``_``**: Depuis C++26, nommer une variable ``_`` (underscore seul) la rend implicitement ``[[maybe_unused]]``.
{% highlight cpp %}
auto [valeur, _] = obtenir_paire(); // Le second élément est ignoré sans warning
{% endhighlight %}

### ``[[fallthrough]]`` (C++17)

Indique qu'une chute intentionnelle entre deux étiquettes de ``switch`` est volontaire. Il doit être placé juste avant le ``case`` suivant sur un énoncé vide.

**Pourquoi l'utiliser ?** Outre le silence du warning ``-Wimplicit-fallthrough``, il documente explicitement l'intention pour les autres développeurs (et les outils d'analyse statique) afin qu'ils ne pensent pas qu'un ``break`` a été oublié par erreur.

{% highlight cpp %}
switch (statut)
{
	case Statut::Initialisation:
		prepare();
		[[fallthrough]]; // Chute voulue: les autres développeurs savent que c'est intentionnel.
	case Statut::Traitement:
		execute();
		break;
}
{% endhighlight %}

### ``[[likely]]`` et ``[[unlikely]]`` (C++20)

Indices pour l'optimiseur afin de favoriser la localité du cache d'instructions et la prédiction de branches. Ils peuvent être utilisés sur des structures de contrôle (``if``, ``else``, ``for``, ``while``) ou des labels de ``switch`` (``case``, ``default``).

#### Exemple: Chemin d'erreur rare
{% highlight cpp %}
if (pointeur == nullptr) [[unlikely]]
{
	return; // Branche rarement prise
}
else [[likely]]
{
	traiter(*pointeur); // Branche nominale très fréquentée
}
{% endhighlight %}

Même code, avec la branche *likely* implicite:
{% highlight cpp %}
if (pointeur == nullptr) [[unlikely]]
{
	return; // Branche rarement prise
}

traiter(*pointeur); // Branche nominale très fréquentée
{% endhighlight %}

> ⚠️ **Note sur ``if constexpr``**: Ces attributs ne s'appliquent pas aux ``if constexpr``. Un ``if constexpr`` est résolu à la compilation: le chemin non pris n'existe tout simplement pas dans le binaire final. La prédiction de branchement n'a donc aucun sens.

### ``[[no_unique_address]]`` (C++20)

Indique au compilateur que si le type d'un membre de classe est vide (sans données), il peut l'optimiser en ne lui allouant aucun octet unique et en le superposant avec d'autres membres (**Empty Member Optimization**).

{% highlight cpp %}
struct ObjetVide {}; // sizeof == 1 (tout objet C++ a une taille d'au moins 1 octet)

struct Conteneur
{
	int valeur;
	[[no_unique_address]] ObjetVide instanceVide;
};
// sizeof(Conteneur) est égal à sizeof(int) car 'instanceVide' ne consomme plus d'espace.
{% endhighlight %}

> ⚠️ **Piège de compatibilité avec MSVC**: Pour des raisons de compatibilité d'ABI, l'implémentation MSVC de Microsoft **ignore silencieusement** l'attribut standard ``[[no_unique_address]]``. Si vous compilez sous MSVC, vous devez obligatoirement utiliser l'attribut propriétaire ``[[msvc::no_unique_address]]`` à la place pour obtenir l'optimisation de taille.

### ``[[assume(expression)]]`` (C++23)

Fournit une vérité axiomatique à l'optimiseur. L'expression est garantie d'être toujours vraie **sans être évaluée au runtime**. Le compilateur l'utilise pour supprimer agressivement des tests de sécurité ou des calculs qu'il sait désormais impossibles.

{% highlight cpp %}
void optimiser(int valeur)
{
	[[assume(valeur > 0)]];
	// L'optimiseur peut supprimer silencieusement toutes les branches gérant les nombres négatifs ou nuls.
}
{% endhighlight %}

> ⚠️ **Danger**: Si l'expression s'avère fausse à l'exécution, le comportement est **immédiatement indéfini (UB)**.

> **Ne pas confondre avec les Contrats**: Vous avez peut-être croisé dans d'anciennes documentations ou articles les syntaxes ``[[expects: expression]]`` (préconditions) ou ``[[ensures: expression]]`` (postconditions). Ces attributs faisaient partie d'une [proposition](https://wg21.link/p0542) acceptée pour le C++20 puis [avortée](https://www.open-std.org/JTC1/SC22/WG21/docs/papers/2019/p1823r0.pdf) juste avant finalisation. Pour C++26, le standard a adopté un nouveau modèle de contrats ([proposal](https://wg21.link/p2900)) qui abandonne totalement la syntaxe sous forme d'attributs au profit de mots-clés dédiés: ``pre(expression)``, ``post(expression)`` et ``contract_assert(expression)``.
{: .block-warning }

### ``[[clang::lifetimebound]]`` / ``[[msvc::lifetimebound]]`` (Extensions propriétaires) {#lifetimebound-extension-clangmsvc}

> Ces attributs ne sont **pas standards** et il n'existe **aucune proposition** pour ajouter un attribut standard ``[[lifetimebound]]`` à la norme C++. Il s'agit d'extensions majeures de sécurité mémoire fournies par les compilateurs Clang et MSVC pour détecter à la compilation les dangling references.

L'attribut propriétaire [``[[clang::lifetimebound]]``](https://releases.llvm.org/16.0.0/tools/clang/docs/AttributeReference.html#lifetimebound) de Clang a été directement inspiré par la proposition [**P0936R0**](http://wg21.link/p0936r0) comme indiqué dans [ce commit de LLVM](https://gitlab.fi.muni.cz/xhoschek/llvm-project/-/commit/f4e248c23e05e374910a8becbb91f5d3d7a76a01) (*"This attribute provides an experimental implementation of the facility described in the C++ committee paper P0936R0."*).

Cette proposition ([**P0936R0**](http://wg21.link/p0936r0)) visait à apporter un nouveau mot clef ``lifetimebound`` dédié à la sécurité des lifetimes.

{% highlight cpp %}
// Syntaxe originale proposée dans P0936R0
struct string_view
{
	// Le mot-clé est placé en tant que modificateur de la fonction membre:
	const char* data() const lifetimebound;
};

// Ou sur des paramètres de fonction:
int& max(int& a lifetimebound, int& b lifetimebound);
{% endhighlight %}

Cependant, il faut noter deux nuances majeures par rapport au papier original:
1. Le papier [**P0936R0**](http://wg21.link/p0936r0) propose l'introduction de ``lifetimebound`` sous forme de **mot clef** et non sous forme d'attribut C++ ``[[...]]``.
2. Bien qu'ils répondent au même besoin, il n'existe **aucune proposition active à ce jour** pour ajouter l'attribut ``[[lifetimebound]]`` dans le standard C++ (voir l'[index officiel du WG21](https://wg21.link/index.html) ou le [suivi des propositions de l'ISO C++](https://github.com/cplusplus/papers/issues)).

Pour les utiliser, il faut donc spécifier le nom du compilateur dans le namespace de l'attribut:
- **Clang**: [``[[clang::lifetimebound]]``](https://releases.llvm.org/16.0.0/tools/clang/docs/AttributeReference.html#lifetimebound)
- **MSVC**: [``[[msvc::lifetimebound]]`` (depuis VS 2022 17.7)](https://learn.microsoft.com/en-us/cpp/code-quality/c26815), nécessite d'activer l'[analyse de code / C++ Core Check](https://learn.microsoft.com/en-us/cpp/code-quality/using-the-cpp-core-guidelines-checkers))

Ces attributs servent à indiquer au compilateur, aux outils d'analyse statique et aux développeurs: *"La valeur de retour d'une fonction, ou l'instance courante, ne doit pas survivre à l'argument marqué"*. Ils permettent de **prévenir les dangling references** en liant la lifetime d'une valeur retournée à celle d'un paramètre ou de l'objet ``this``.

*(Dans les exemples suivants, nous utiliserons la syntaxe de Clang ``[[clang::lifetimebound]]`` à titre d'illustration)*.

{% highlight cpp %}
struct Owner
{
	std::string data;
	// Indique que la vue retournée ne doit pas survivre à l'objet Owner
	[[nodiscard]] std::string_view getView() const [[clang::lifetimebound]]
	{
		return data;
	}
};
{% endhighlight %}

#### ``[[clang::lifetimebound]]`` et deducing this (C++23)

Avec l'arrivée du **Deducing This** en C++23, la question du placement de l'attribut se pose. Les compilateurs comme Clang ou MSVC permettent de le placer **directement sur le paramètre ``self``**.

##### Pourquoi sur ``self`` ?

L'attribut ``[[clang::lifetimebound]]`` sert à indiquer au compilateur que *"la valeur de retour d'une fonction, ou l'instance courante, ne doit pas survivre à l'argument marqué*.

- **En syntaxe classique**: L'objet ``this`` est implicite. Quand on place l'attribut à la fin de la fonction, le compilateur comprend par convention qu'il s'applique au ``this`` invisible.
- **Avec le Deducing This**: L'objet ``this`` devient un paramètre explicite (``self``). En le mettant sur ``self``, on indique clairement que le retour est lié à l'objet lui-même.

##### Bug classique prévenu

Imaginons le code suivant dans une bibliothèque:
{% highlight cpp %}
[[nodiscard]] inline auto operator[](this auto&& self [[clang::lifetimebound]], std::string_view key) -> const Value&;
{% endhighlight %}

Et que l'utilisateur fasse ceci:
{% highlight cpp %}
const auto& value = Json::parse("{...}")["myKey"];
// value est une dangling reference !
{% endhighlight %}

> ⚠️ **Erreur critique**: La valeur retournée pointe dans un objet temporaire qui meurt à la fin de la [full-expression](https://cppreference.com/cpp/language/expressions#Full-expressions).

Grâce à ``[[clang::lifetimebound]]`` sur ``self``, le compilateur (Clang notamment) va générer un warning:
``warning: temporary bound to local reference 'value' will be destroyed at the end of the full-expression``

##### La précision des catégories de valeur

L'avantage de le mettre sur ``self``, c'est que la vérification est extrêmement précise selon la catégorie de la valeur appelante:
- Si ``self`` est déduit comme ``Value&`` (lvalue), le retour est lié à un objet durable.
- Si ``self`` est déduit comme ``Value&&`` (rvalue temporaire), le compilateur sait que conserver la valeur de retour est une opération critique et dangereuse.

##### Comparaison de syntaxe et pièges de Clang

Sur une fonction membre, avec la syntaxe classique, l'attribut doit se placer après les qualificatifs (``const``, ``&``, ``&&``) mais avant ``noexcept`` ou le trailing return type (``->``):

Dès qu'une fonction membre devient complexe, la syntaxe devient un champ de mines:
{% highlight cpp %}
auto get() const & [[clang::lifetimebound]] noexcept -> T& // Clang peut être capricieux sur l'ordre
{% endhighlight %}

Les compilateurs, et Clang en particulier, sont particulièrement stricts sur l'ordre exact de ces éléments.<br>
Bien que Clang l'accepte sur la méthode, dès qu'une référence sur la fonction (``&`` ou ``&&``) est présente, le parseur devient extrêmement instable et peut émettre des erreurs de syntaxe cryptiques (comme ``expected ';'``) même si l'ordre semble logique.

Une alternative plus lisible consiste à suivre la syntaxe du **deducing this**:
{% highlight cpp %}
auto get(this auto&& self [[clang::lifetimebound]]) const & noexcept -> T&
{% endhighlight %}

En plaçant ``[[clang::lifetimebound]]`` directement sur ``self`` (grâce au **deducing this**), on sort de cette zone grise de la grammaire pour repasser sur une déclaration de paramètre classique, ce qui est **100% robuste** pour tous les compilateurs.

De plus, la cible de cet attribut devient directement plus clair (l'element lui-même, ``self``).<br>
Et ne pas oublier qu'il s'agit **aussi** d'une **information très utile pour le développeur** appelant vos fonctions. Ce doit être clair aussi pour les développeurs.

| Style | Syntaxe | Cible de l'attribut |
| :--- | :--- | :--- |
| **Classique** | ``const T& get() const [[clang::lifetimebound]]`` | Appliqué à la fonction (cible ``this`` implicite) |
| **Moderne** | ``const T& get(this auto&& self [[clang::lifetimebound]])`` | Appliqué explicitement au paramètre ``self`` |

En résumé: C'est la manière la plus propre de lier le retour non pas à "la fonction", mais spécifiquement à **l'objet qui l'appelle**.

### ``[[indeterminate]]`` (C++26)

Avant C++26, les **variables locales [automatiques](/articles/cpp/auto#automatic-storage-duration-specifier-avant-c11-obsolète)** (non ``static`` ni ``thread_local``) (comme les [**types fondamentaux**](/articles/cpp/fundamental_types) ou les tableaux) déclarées **sans initialiseur** n'étaient [**pas initialisées par défaut**](/articles/cpp/uniform_initialization#variable-déclarée-mais-pas-initialisée): elles contenaient des **valeurs arbitraires** (déchets de la stack) et leur **lecture accidentelle** provoquait un **[comportement indéfini (UB)](https://en.cppreference.com/cpp/language/ub#Uninitialized_scalar)**.

{% highlight cpp %}
void crashOrVulnerability()
{
	int x; // Non initialisé (stack garbage)
	int y = x + 1; // Undefined Behavior (UB)
}
{% endhighlight %}

Pour éradiquer ce **problème de sécurité** majeur, C++26 introduit le concept de **[comportement erroné (erroneous behavior)](https://wg21.link/p2795r5)** (un comportement **officiellement incorrect** dans la logique du programme, mais dont l'effet reste [**déterministe** et sécurisé](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2024/p2795r5.html#proposal) pour **éliminer les failles mémoire**, contrairement aux optimisations agressives et imprévisibles du **comportement indéfini** (UB)).

Désormais, le compilateur [**initialise automatiquement à une valeur** fixe définie par l'implémentation (généralement zéro, mais les compilateurs peuvent choisir des valeurs de "poisoning" différentes selon le mode de build)](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2024/p2795r5.html#proposal) toutes les variables locales non initialisées explicitement, y compris les [types fondamentaux](/articles/cpp/fundamental_types) et les tableaux. Si le programme lit cette variable avant d'y avoir écrit, le comportement reste déterministe (il utilise cette valeur d'initialisation par défaut) mais est classifié comme une erreur de programmation (le *comportement erroné*), permettant aux compilateurs et aux outils d'analyse (comme [MemorySanitizer / MSAN](https://clang.llvm.org/docs/MemorySanitizer.html)) de le signaler de manière fiable.

{% highlight cpp %}
void secureBehavior()
{
	int x; // Automatiquement initialisé (possiblement avec la valeur 0)
	int y = x + 1; // Erroneous behavior: lecture déterministe, mais étiqueté comme une erreur
}
{% endhighlight %}

L'attribut [``[[indeterminate]]``](https://en.cppreference.com/cpp/language/attributes/indeterminate) sert de **déclaration d'exemption**.<br>
Appliqué à une variable locale, il demande au compilateur de **désactiver l'initialisation automatique de sécurité** pour des raisons de **performance**.

{% highlight cpp %}
void readNetworkData(char* destination, std::size_t size);

void process()
{
	[[indeterminate]] char buffer[4096];
	readNetworkData(buffer, sizeof(buffer));
}
{% endhighlight %}

> Notez **l'absence d'initialisation avec ``auto``** ici (``auto buffer = std::array<char, 4096>{};``), syntaxe qui aurait [empêché de déclarer la variable sans l'initialiser](/articles/cpp/auto#auto-force-linitialisation) (ce que nous recherchons ici pour des raisons de **performances**).
{: .block-warning }

> Le compilateur reste libre de l'ignorer et d'initialiser quand même la variable par sécurité, conformément à la [règle d'ignorabilité](#la-règle-dignorabilité) des attributs.

Si l'exemption est prise en compte, la variable retrouve son comportement historique: son contenu est indéterminé, et toute lecture avant écriture redevient un **[comportement indéfini (UB)](https://en.cppreference.com/cpp/language/ub#Uninitialized_scalar)**.

### ``[[optimize_for_synchronized]]`` (TM TS)

Cet attribut fait partie des extensions définies par la [**Transactional Memory Technical Specification** (ISO/IEC TS 19841:2015)](https://www.open-std.org/jtc1/sc22/wg21/docs/papers/2015/n4514.pdf), un document technique visant à introduire le concept de **mémoire transactionnelle** en C++.

La mémoire transactionnelle permet d'exécuter des blocs de code de manière atomique à l'aide de blocs ``synchronized``. En cas de conflit d'accès mémoire entre threads, la transaction échoue et redémarre automatiquement, sans nécessiter de verrous (locks) explicites.

#### Le mot clef experimental ``synchronized``

Pour délimiter les zones critiques sans manipuler manuellement de verrous (comme ``std::mutex``), cette spécification introduit le mot clef expérimental [``synchronized``](https://en.cppreference.com/cpp/language/transactional_memory#Synchronized_blocks). Un bloc de code marqué ``synchronized { ... }`` s'exécute sous **exclusion mutuelle**: le résultat final est équivalent à une exécution séquentielle (un bloc ``synchronized`` après l'autre).

{% highlight cpp %}
void process(int value)
{
	synchronized
	{
		int current = getGlobalCounter();
		setGlobalCounter(current + value);
	}
}
{% endhighlight %}

En coulisses, plutôt que de bloquer les threads avec un verrou physique, le compilateur et le processeur tentent d'exécuter ce bloc avec une [**concurrence optimiste**](https://en.wikipedia.org/wiki/Optimistic_concurrency_control) (en surveillant les adresses lues et écrites). Si aucun autre thread n'a modifié les mêmes adresses durant l'exécution, les changements sont validés (*commit*). En cas de conflit (si un autre thread écrit sur l'une de ces adresses), la transaction est annulée (**avortement de transaction** ou *transaction abort*) et recommence automatiquement.

Lorsqu'un bloc ``synchronized`` appelle une fonction **non [inlinée](https://fr.wikipedia.org/wiki/Extension_inline)**, le compilateur, **par sécurité**, doit généralement **abandonner l'exécution concurrente optimiste** et **acquérir un verrou physique bloquant**. Cela force les threads à s'attendre et à s'exécuter un par un, éliminant tout parallélisme et **dégradant fortement les performances**.

#### L'attribut experimental ``[[optimize_for_synchronized]]``

L'attribut [``[[optimize_for_synchronized]]``](https://en.cppreference.com/cpp/language/attributes/optimize_for_synchronized) résout ce problème. Il est indispensable lorsque le corps de la fonction **n'est pas connu dans la [translation unit](/articles/cpp/translation_unit) courante**: il indique au compilateur (si l'attribut est [honoré](#la-règle-dignorabilité)) qu'une version optimisée pour les transactions sera bien disponible lors de l'édition de liens.

{% highlight cpp %}
// Indique au compilateur d'optimiser cette fonction pour l'appel transactionnel
[[optimize_for_synchronized]] void updateData();

void process()
{
	synchronized
	{
		updateData(); // Appel sécurisé sans bloquer la concurrence optimiste
	}
}
{% endhighlight %}

Grâce à cet attribut, le compilateur génère deux versions distinctes de la fonction dans le binaire (un mécanisme appelé [**transaction clone**](https://en.cppreference.com/cpp/language/transactional_memory) ou clonage transactionnel):
1. Une version standard pour les appels classiques hors transactions.
2. Un **clone transactionnel** conçu pour optimiser les transactions. Dans cette version, **chaque accès mémoire est tracé** par le compilateur (injection de barrières logicielles de lecture/écriture). Le compilateur y **élimine les barrières de transaction redondantes** et **optimise le code** de manière à ce qu'il s'exécute **le plus rapidement possible**. Cela réduit la durée globale de la transaction, limitant ainsi la probabilité qu'un autre thread écrive en même temps et provoque un avortement de transaction (*transaction abort*).

#### Statut expérimental

Les spécifications de mémoire transactionnelle n'ayant encore jamais été intégrées au standard C++ officiel, cet attribut reste expérimental. GCC est actuellement le seul compilateur majeur à proposer un support expérimental (via l'option [``-fgnu-tm``](https://gcc.gnu.org/onlinedocs/gcc/C-Dialect-Options.html#index-fgnu-tm)), tandis que Clang et MSVC ne l'implémentent pas.

---

Aller plus loin:
- [RAII](/articles/cpp/raii)
- [Gestion d'erreurs](/articles/cpp/error_handling)
