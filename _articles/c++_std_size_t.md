---
layout: article
title: Les tailles en C++ (std::size_t)
permalink: articles/c++/size
category: c++
logo: c++.svg
background: sea5.webp
seo:
  title: "Maîtriser std::size_t en C++: Tailles, types signés et bonnes pratiques"
  description: "Pourquoi et comment utiliser std::size_t, std::ssize_t et std::ptrdiff_t. Comprendre les risques à ne pas les utiliser, les garanties de la norme et les littéraux C++23."
published: true
---

En C++, typer les tailles et index avec ``int`` ou ``unsigned int`` est une erreur fréquente. Le **type canonique** est **``std::size_t``**.

## Pourquoi ne pas utiliser ``int`` ou ``unsigned int`` ?

Sur la majorité des systèmes 64 bits modernes, les types ``int`` et ``unsigned int`` restent stockés sur **32 bits** ([modèles LP64 ou LLP64](#dépendance-à-labi-et-au-modèle-de-données)). Cela limite leur valeur maximale: environ 2 milliards pour le signé et 4 milliards pour le non signé.

L'utilisation d'un ``unsigned int`` pour itérer sur un grand tableau ou un fichier dépassant 4 Go provoquera un **débordement (overflow)**:

{% highlight cpp %}
std::vector<char> largeVector(5'000'000'000); // 5 Go (dépasse les 4,2 milliards d'un uint32)

// DANGEREUX: i débordera avant d'atteindre la fin (boucle infinie ou crash)
for (unsigned int i = 0; i < largeVector.size(); ++i) { ... }
{% endhighlight %}

À l'inverse, [``std::size_t``](#stdsize_t-en-c) est **garanti d'être assez large** pour adresser la plus grande zone mémoire possible sur votre architecture (64 bits sur un système 64 bits).

## Héritage du C: ``size_t``

Avant le C++, le **langage C** a introduit [**``size_t``**](https://en.cppreference.com/w/c/types/size_t.html) (via [``<stddef.h>``](https://en.cppreference.com/w/c/header/stddef.html)) comme **type standard pour toute manipulation de mémoire**. Le standard **POSIX** (fondé sur le C) l'a ensuite intégré et imposé dans ses propres interfaces, notamment via le header système [``<sys/types.h>``](https://man7.org/linux/man-pages/man3/size_t.3type.html).

Il est omniprésent dans la bibliothèque standard C:
- **Allocation**: [``void* malloc(size_t size);``](https://man7.org/linux/man-pages/man3/malloc.3.html)
- **Mémoire**: [``void* memcpy(void* dest, const void* src, size_t n);``](https://man7.org/linux/man-pages/man3/memcpy.3.html)
- **Chaînes**: [``size_t strlen(const char* s);``](https://man7.org/linux/man-pages/man3/strlen.3.html)
- **Entrées/Sorties**: [``fread``](https://man7.org/linux/man-pages/man3/fread.3.html), [``fwrite``](https://man7.org/linux/man-pages/man3/fwrite.3.html), [``strncmp``](https://man7.org/linux/man-pages/man3/strncmp.3.html), etc.

> **Usage sémantique**: Bien qu'originellement lié à la mémoire, ``size_t`` est le type sémantiquement correct pour toute variable représentant une **quantité ou un comptage** qui ne peut pas être négatif. Si le C historique a souvent utilisé ``int`` ou ``unsigned int`` par simplicité (au risque d'erreurs de signe ou de dépassement), l'usage de ``size_t`` est préférable pour la portabilité et la clarté.

Contrairement aux hypothèses fréquentes, le standard n'impose **pas de type sous-jacent fixe** (comme ``unsigned int`` ou ``unsigned long long``).

Selon la [**norme C (C99)**](https://en.cppreference.com/w/c/types/size_t.html):
- C'est un **type entier non signé**
- Sa largeur est d'au moins **16 bits** [selon la norme C99 ("The bit width of size_t is not less than 16. (since C99)")](https://en.cppreference.com/w/c/types/size_t.html)
- Il est suffisant pour représenter la **taille maximale d'un objet** (typiquement un tableau) supporté par le système
- C'est le type de retour des opérateurs [**``sizeof``**](https://en.cppreference.com/w/c/language/sizeof.html) et [**``_Alignof``**](https://en.cppreference.com/w/c/language/_Alignof.html) (C11, aujourd'hui obsolète) et [**``alignof``**](https://en.cppreference.com/w/c/language/alignof.html) (C23, son remplaçant)

La liberté est donc volontairement laissée **aux compilateurs de choisir le type sous-jacent** derrière ``size_t``. On dit qu'il est [*implementation-defined*](https://gcc.gnu.org/onlinedocs/gcc-6.2.0/cpp/Implementation-defined-behavior.html).

> Windows a également créé le sien, [**``SIZE_T``**](https://learn.microsoft.com/fr-fr/windows/win32/winprog/windows-data-types#size_t) déclaré dans l'**API Windows** (accessible via [``<BaseTsd.h>``](https://learn.microsoft.com/fr-fr/windows/win32/winprog/windows-data-types#size_t)). Il est défini comme suit: ``typedef ULONG_PTR SIZE_T;``, lui même étant défini comme [``typedef unsigned __int3264 ULONG_PTR;``](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-dtyp/21eec394-630d-49ed-8b4a-ab74a1614611) dont [``unsigned __int3264``](https://learn.microsoft.com/en-us/windows/win32/midl/--int3264) est un **``unsigned int`` de 32 ou de 64 bits selon la plateforme**.
>
> Etant **spécifique à l'API Windows**, il n'est **pas portable** contrairement à ``size_t``.

Mettons ces informations en forme dans un tableau que nous allons faire évoluer au fur et à mesure que de nouvelles informations s'ajoutent.

| type     | type réel                | Portabilité                    |
| -------- | :----------------------: | ------------------------------ |
| `size_t` | *implementation-defined* | oui (standard, ISO C et POSIX) |
| `SIZE_T` | ULONG_PTR                | non (API Windows)              |

### Dépendance à l'ABI et au modèle de données

Ok, le standard reste assez flou sur la taille réelle de ``size_t``.<br>
Sa taille dépend de l'architecture. Sur les **systèmes 32 bits**, ``size_t`` a souvent une **taille de 32 bits**. Et sur **systèmes 64** bits, une **taille de 64 bits**, mais ce n'est **pas garanti**.

La taille réelle de ``size_t`` dépend de l'[**ABI** (Application Binary Interface)](https://fr.wikipedia.org/wiki/Application_binary_interface) et du [**modèle de données**](https://en.wikipedia.org/wiki/64-bit_computing#64-bit_data_models) utilisé par le compilateur:

| Modèle | Système                                                | ``short`` | ``int`` | ``long`` | ``long long`` | ``size_t``  | ``pointeur`` |
| ------ | ------------------------------------------------------ | --------- | ------- | -------- | ------------- | ----------- | ------------ |
| IP16   | MS-DOS, CP/M, Unix 16-bit, [PDP-11](https://fr.wikipedia.org/wiki/PDP-11) | 16 bits | 16 bits | 16 bits | 64 bits | **16 bits** | 16 bits |
| LP32   | Win16, macOS 68k                                       | 16 bits   | 16 bits | 32 bits  | 64 bits       | **32 bits** | 32 bits |
| ILP32  | Win32, Linux 32, BSD                                   | 16 bits   | 32 bits | 32 bits  | 64 bits       | **32 bits** | 32 bits |
| LLP64  | Windows 64 (Windows après XP), MinGW                   | 16 bits   | **32 bits**&nbsp;⚠️ | 32 bits  | 64 bits       | **64 bits** | 64 bits |
| LP64   | Linux 64, macOS, Solaris, BSD, Cygwin sur Windows      | 16 bits   | **32 bits**&nbsp;⚠️ | 64 bits  | 64 bits       | **64 bits** | 64 bits |
| ILP64  | Unix HPC                                               | 16 bits   | 64 bits | 64 bits  | 64 bits       | **64 bits** | 64 bits |
| SILP64 | [UNICOS de Cray](https://en.wikipedia.org/wiki/UNICOS) | 64 bits   | 64 bits | 64 bits  | 64 bits       | **64 bits** | 64 bits |

(Sources: [Wikipedia: 64-bit data models](https://en.wikipedia.org/wiki/64-bit_computing#64-bit_data_models), [Doc C++](https://en.cppreference.com/w/cpp/language/types.html#Properties), [Doc Rust](https://docs.rs/data_models/latest/data_models/enum.DataModel.html), [Doc Oracle](https://docs.oracle.com/cd/E19620-01/805-3024/lp64-1/index.html))

> ⚠️ Les types signed ont **la même taille** en octets que les types ``unsigned``.<br>
> Surtout, n'utilisez ni ``int`` ni ``unsigned int`` pour manipuler des **tailles**, des **quantités** ou des **index**, utilisez ``size_t``.
{: .block-warning }

**ILP64** n'est **presque jamais utilisé comme ABI système**. Il est utilisé par des **bibliothèques scientifiques** comme:
- [Intel Math Kernel Library](https://www.intel.com/content/www/us/en/docs/onemkl/developer-guide-linux/2023-0/using-the-ilp64-interface-vs-lp64-interface.html)
- [ScaLAPACK](https://docs.discoverer.bg/scalapack.html)
- [BLAS](https://www.intel.com/content/www/us/en/docs/onemkl/developer-guide-linux/2023-0/using-the-ilp64-interface-vs-lp64-interface.html)

> **Note concernant les compilateurs 16 bits:**
>
> Dans l'architecture **[x86 segmentée](https://en.wikipedia.org/wiki/X86_memory_segmentation)**, les objets ordinaires étaient généralement [limités à **64 Ko** par segment](https://en.wikipedia.org/wiki/X86_memory_segmentation#Real_mode), bien que [les pointeurs ``huge`` puissent adresser des objets plus grands](https://en.wikipedia.org/wiki/X86_memory_models#Memory_models#Pointer_sizes), ce qui pouvait théoriquement **dépasser** la plage représentable par un `size_t` de 16 bits.

## ``std::size_t`` en C++

En C++, le type [**``std::size_t``**](https://en.cppreference.com/w/cpp/types/size_t.html) est le **type canonique** pour représenter toute forme de **taille**, de **quantité** ou d'**index**, dépassant le cadre de la simple manipulation de mémoire.

On y accède par le header [``<cstddef>``](https://en.cppreference.com/w/cpp/header/cstddef.html) (ou tout autre header standard qui l'inclut indirectement, comme ``<vector>`` ou ``<string>``).

> ``std::size_t`` n'est **pas réservé aux fonctions de la bibliothèque standard**. C'est le type à privilégier dans votre propre code pour toute variable ayant une **sémantique de taille ou d'index** (taille d'une image, nombre de joueurs, numéro d'un élément dans une liste, etc).

A l'instar du C, le standard C++ n'impose **aucun type sous-jacent fixe** pour ``std::size_t`` ; sa définition exacte est **implementation-defined** mais sa largeur est d'**au moins 16 bits** (["The bit width of ``size_t`` is not less than 16. (since C++11)"](https://en.cppreference.com/w/cpp/types/size_t.html)).

> Petite information amusante au sujet de ``sizeof``:<br>
> - [**``sizeof``**](https://en.cppreference.com/w/cpp/language/sizeof.html), [**``sizeof...``**](https://en.cppreference.com/w/cpp/language/sizeof...) (C++11) et [**``alignof``**](https://en.cppreference.com/w/cpp/language/alignof.html) (C++11) retournent tous un ``std::size_t``.<br>
> - [**``std::size_t``**](https://en.cppreference.com/w/cpp/types/size_t.html#Possible_implementation) est lui-même défini comme le type retourné par ``sizeof``.
>
> Cette définition circulaire **délègue la décision finale au compilateur**, qui choisit le type le plus adapté à l'architecture.

En plus d'hériter des garanties du C, le C++ apporte ses propres précisions:
- Ses limites sont accessibles via [**``std::numeric_limits<std::size_t>``**](https://en.cppreference.com/w/cpp/types/numeric_limits.html).
- Il est utilisé par convention comme base pour définir le type membre ``size_type`` de tous les conteneurs de la STL.

| Variante | Header | Namespace | |
| :--- | :--- | :--- | :--- |
| ``size_t`` | ``<stddef.h>`` | Global | Héritage du C |
| ``std::size_t`` | ``<cstddef>`` | ``std::`` | Version idiomatique C++ |

Le standard C++ précise que ``<cstddef>`` place le type dans le namespace ``std`` et *peut* (mais n'est pas obligé de) le placer également dans le namespace global. Pour un code portable et propre, préférez toujours **``std::size_t``**.

## Les pièges du typage

### Le mélange signé / non-signé

Mélanger des types signés et ``std::size_t`` est une source majeure de bugs:

{% highlight cpp %}
int i = -1;
std::size_t n = 10;

if (i < n) { 
    // On s'attend à 'true', mais ce sera 'false' !
}
{% endhighlight %}

Lorsqu'un type signé et un type non signé sont utilisés dans une opération (ici i < n), C++ applique les [**usual arithmetic conversions**](https://en.cppreference.com/w/cpp/language/usual_arithmetic_conversions.html).<br>
Le type signé (``int``) est converti vers le type non-signé (``std::size_t``). ``i = -1`` devient une valeur non-signée sur 64 bits, ``std::size_t{-1}``. La valeur ``-1`` devient alors la valeur maximale de ``std::size_t`` par overflow (``2⁶⁴-1``), ce qui est bien supérieur à 10.

Ca aura donc l'effet suivant:
{% highlight cpp highlight_lines="4" %}
int i = -1;
std::size_t n = 10;

if (static_cast<std::size_t>(i) < n) { 
    // On s'attend à 'true', mais ce sera 'false' !
}
{% endhighlight %}

> **Arithmétique différente**: Les types non signés (comme ``std::size_t``) suivent une arithmétique **modulo ``2ⁿ``**: toute opération dépassant la capacité **wrap-around de manière définie**. Les types signés, eux, peuvent subir un **comportement indéfini** ([*undefined behavior*](https://en.cppreference.com/w/cpp/language/ub.html)) si le résultat dépasse la plage représentable. Le standard ne garantit rien: le compilateur peut optimiser en supposant que ça n'arrive jamais.

Les [promotions intégrales](https://en.cppreference.com/w/cpp/language/implicit_cast.html#Integral_promotion) des petits types vers ``int`` préservent la valeur et n'introduisent pas d'overflow.

### L'underflow dans les boucles

L'utilisation de ``std::size_t`` dans les boucles décrémentales est particulièrement risquée:

{% highlight cpp %}
std::vector<int> v = { ... };

// DANGEREUX: Si v est vide, v.size() - 1 provoque un underflow massif
for (std::size_t i = v.size() - 1; i >= 0; --i) { ... }
{% endhighlight %}

## Les alternatives signées en C: ``ssize_t`` et ``ptrdiff_t``

### Le cas ``ssize_t``

``std::size_t`` est le type canonique pour les **tailles**, les **quantités** et les **index**, mais il ne doit pas être utilisé pour représenter une **différence** ou une [**distance**](https://en.cppreference.com/w/cpp/iterator/distance.html) (qui peuvent être négatives).

Le type [**``ssize_t``**](https://man7.org/linux/man-pages/man3/size_t.3type.html) est un type historique des systèmes **POSIX** (Linux/Unix).

| type      | type réel                | Portabilité                    |
| --------- | :----------------------: | ------------------------------ |
| `size_t`  | *implementation-defined* | oui (standard, ISO C et POSIX) |
| `ssize_t` | *implementation-defined* | non (POSIX uniquement)         |
| `SIZE_T`  | ULONG_PTR                | non (API Windows)              |
| `SSIZE_T` | ULONG_PTR                | non (API Windows)              |

``ssize_t`` n'est donc **pas un bon candidat** pour représenter une **différence/distance** en C.

### ``ptrdiff_t``: Le type des distances

Le type [**``ptrdiff_t``**](https://en.cppreference.com/w/c/types/ptrdiff_t.html) est l'alias standard pour un type **entier signé** représentant le résultat de la soustraction de deux pointeurs (``ptr2 - ptr1``).

Il peut être formellement défini en C via l'expression suivante:
{% highlight cpp %}
typedef typeof((int*)nullptr - (int*)nullptr) ptrdiff_t;
{% endhighlight %}

Sa taille est garantie de faire [au moins 17 bits avant C23, et au moins 16 bits à partir de C23](https://en.cppreference.com/w/c/types/ptrdiff_t.html).

Comme le laisse penser son nom, c'est **sémantiquement** son sens premier. Mais il est **parfaitement adapté** pour représenter n'importe quelle soustraction entre deux ``size_t``.

Exemple 1: **Restaurer un pointeur après réallocation**
{% highlight c linenos %}
char *buffer = malloc(1024);
char *current = buffer + 512; // Pointeur au milieu du bloc
ptrdiff_t offset = current - buffer; // On mémorise la distance relative

char *reallocatedBuffer = realloc(buffer, 2048);
if (reallocatedBuffer)
{
	// Si le bloc a été déplacé en mémoire, 'current' est désormais invalide.
	// On utilise l'offset pour rétablir le pointeur à la bonne position.
	current = reallocatedBuffer + offset;
}
{% endhighlight %}

Exemple 2: **Calculer un index à partir d'un pointeur**
{% highlight c %}
int values[] = {10, 20, 30, 40, 50};
int *position = &values[3]; // Pointeur vers l'élément '40'
ptrdiff_t index = position - values; // index = 3
{% endhighlight %}

### Limitation de la plage de valeurs

- ``size_t`` est [garanti de faire au moins 16 bits](https://en.cppreference.com/w/c/types/size_t.html).
- ``ptrdiff_t`` est [garanti de faire au moins 17 bits (avant C23, maintenant 16 bits)](https://en.cppreference.com/w/c/types/ptrdiff_t.html)

Cette différence laisse penser que le **bit supplémentaire** pour ``ptrdiff_t`` est **réservé au bit de signe**, pour permettre à tout ``size_t`` d'être compris dans ``ptrdiff_t``.

Mais concrètement sur les architectures 64 bits modernes, [``size_t``](#héritage-du-c-size_t) et [``ptrdiff_t``](#ptrdiff_t-le-type-des-distances) sont définis sur [64 bits](#dépendance-à-labi-et-au-modèle-de-données).

Il n'est donc **pas garanti** que ``size_t`` tienne toujours dans ``ptrdiff_t``, même si sur 64 bits ça se vérifie.

La garantie vient de la définition même de ``ptrdiff_t``:
- Il est conçu pour contenir la différence entre deux pointeurs pointant **dans le même objet ou tableau**.
- Le standard impose que ``ptrdiff_t`` soit **suffisamment grand** pour représenter **toutes ces différences**.

Même si ``size_t`` peut représenter des valeurs supérieures à ``PTRDIFF_MAX`` sur certaines plateformes, **aucune différence de pointeurs légale** dans le même objet **ne pourra dépasser ``PTRDIFF_MAX``**. Les différences de pointeurs sont **limitées par la taille maximale d’un objet contigu en mémoire**.

## Les alternatives signées en C++: ``std::ssize`` et ``std::ptrdiff_t``

Contrairement à une idée reçue, **il n'existe pas de type ``std::ssize_t``** dans le standard C++. Le comité C++ a jugé qu'un tel type **serait redondant** avec [``std::ptrdiff_t``](#stdptrdiff_t-le-type-des-distances).

Le standard a choisi **une fonction plutôt qu'un type**. [**``std::ssize()``**](https://en.cppreference.com/w/cpp/iterator/size.html) ([**P1227R2**](https://wg21.link/p1227r2)) retourne l'**équivalent signé** de ``std::size_t``, **généralement** ``std::ptrdiff_t`` mais ce n'est **pas garanti** que ce soit exactement ce type.

Il est également possible d'obtenir l'équivalent signé d'un type via le trait de type [**``std::make_signed_t``**](https://en.cppreference.com/w/cpp/types/make_signed):
{% highlight cpp %}
using signed_size_t = std::make_signed_t<std::size_t>; // équivalent à std::ptrdiff_t
{% endhighlight %}

{% highlight cpp %}
// std::ssize renvoie un type signé
for (auto i = std::ssize(v) - 1; i >= 0; --i) { ... }
{% endhighlight %}

### ``std::ptrdiff_t``: Le type des distances

Comme [``ptrdiff_t``](#ptrdiff_t-le-type-des-distances) en C, le type [**``std::ptrdiff_t``**](https://en.cppreference.com/w/cpp/types/ptrdiff_t.html) est l'alias standard pour un type **entier signé** en C++. Type adapté pour représenter n'importe quelle soustraction entre deux ``std::size_t`` ou entre deux pointeurs (``ptr2 - ptr1``).

Il peut être formellement défini via l'expression suivante:
{% highlight cpp %}
using ptrdiff_t = decltype(static_cast<int*>(nullptr) - static_cast<int*>(nullptr));
{% endhighlight %}

| type | type réel | Portabilité |
| :--- | :---: | :--- |
| **``std::size_t``** | *implementation-defined* | oui (standard ISO C++) |
| **``std::ptrdiff_t``** | *implementation-defined* | oui (standard ISO C++) |

Sa largeur est garantie de faire au moins **17 bits** ([The bit width of std::ptrdiff_t is not less than 17. (since C++11)](https://en.cppreference.com/w/cpp/types/ptrdiff_t.html))

> Concernant les **plages de valeurs** de ``std::size_t`` et ``std::ptrdiff_t``, le standard C++ donne les mêmes garanties que le standard C.<br>
> ``std::size_t`` n'est **pas formellement compris** dans ``std::ptrdiff_t``, mais ce n'est **pas un problème** pour autant. C'est plus compliqué que ça. Nous en avons parlé [**ici**](#limitation-de-la-plage-de-valeurs).

## Dans la STL (Standard Template Library)

Les conteneurs de la STL (``vector``, ``list``, ``string``, etc) définissent des **alias internes** pour **garantir la généricité** du code.

Ils sont **visibles en public** dans les classes, et dans presque toutes les **signatures de fonctions** membres:

- **``T::size_type``**: Type non signé pour représenter le **nombre d'éléments stockés**. C'est notamment le type de retour de la méthode [**``std::vector<T>::size()``**](https://en.cppreference.com/w/cpp/container/vector/size) et le type attendu par l'opérateur [**``std::vector<T>::operator[]``**](https://en.cppreference.com/w/cpp/container/vector/operator_at).

- **``T::difference_type``**: Type signé pour les distances. C'est le type retourné par l'opérateur de **soustraction entre deux itérateurs** (``it2 - it1``) ou par la fonction [**``std::distance``**](https://en.cppreference.com/w/cpp/iterator/distance).

{% highlight cpp %}
std::vector<int> numbers = {10, 20, 30};

std::vector<int>::size_type size = numbers.size(); // Type de retour de .size()
std::vector<int>::difference_type distance = numbers.end() - numbers.begin(); // Distance entre itérateurs
{% endhighlight %}

{% highlight cpp %}
std::vector<int> numbers = {10, 20, 30};

std::size_t size = numbers.size();
std::ptrdiff_t distance = numbers.end() - numbers.begin();
{% endhighlight %}

Ou si vous avez **peur de mal typer** vos variables, je vous encourage vivement à utiliser [**``auto``**](/articles/c++/auto):

{% highlight cpp %}
auto numbers = {10, 20, 30};

auto size = numbers.size();
auto distance = numbers.end() - numbers.begin();
{% endhighlight %}

Il prend le type retourné par les fonctions, [**sans risque de conversion maladroite**](#auto-complique-la-lecture-du-code).

## Literals (Depuis C++23)

Le C++23 introduit des [**literals**](/articles/c++/literals#size-literal-c23) pour manipuler ces types sans conversion implicite:

| Suffixe | Type |
| :--- | :--- |
| **``uz``**, **``zu``** (et variantes) | ``std::size_t`` |
| **``z``**, **``Z``** | ``std::make_signed_t<std::size_t>`` |

{% highlight cpp %}
// Manipulation d'un index avec le literal uz (C++23) et la fonction std::size() (C++17)
for (auto i = 0uz; i < std::size(container); ++i)
{
	// ...
}
{% endhighlight %}

{% highlight cpp %}
// Boucle décrémentale sûre, avec le literal signé z (C++23)  et la fonction std::size() (C++20)
// i peut devenir négatif (-1), ce qui arrête proprement la boucle
for (auto i = std::ssize(container) - 1; i >= 0z; --i)
{
	// ...
}
{% endhighlight %}

## Le cas particulier de Qt: ``qsizetype``

``qsizetype`` est un type faisant partie du framework **Qt**. Cette section ne concerne que les développeurs qui l'utilisent.

Le framework **Qt** a toujours privilégié les types signés (historiquement ``int``) pour ses conteneurs.

Avec l'arrivée du 64 bits, [le type int (32 bits) était **limité** à 2 Go](#dépendance-à-labi-et-au-modèle-de-données).
[``qsizetype``](https://doc.qt.io/qt-6/qttypes.html#qsizetype-typedef) a été créé (dans Qt 5.10) pour répondre aux mêmes besoins que ``std::size_t`` et permettre l'usage de -1 comme valeur sentinelle ([QString::indexOf()](https://doc.qt.io/qt-6/qstring.html#indexOf) retourne -1 si non trouvé).
``qsizetype`` permet de monter à 64 bits tout en restant signé.

``qsizetype`` est défini comme étant [la version signée de ``std::size_t``](https://qthub.com/static/doc/qt5/qtcore/qtglobal.html#qsizetype-alias):
{% highlight cpp %}
using qsizetype = QIntegerForSizeof<std::size_t>::Signed;
{% endhighlight %}

On reconnait ``QIntegerForSizeof<T>::Signed``, l'équivalent *made in Qt* pour ``std::make_signed_t<T>``, [défini comme](https://codebrowser.dev/qt5/qtbase/src/corelib/global/qglobal.h.html#QIntegerForSize):
{% highlight cpp highlight_lines="4 5 10" %}
template <int> struct QIntegerForSize;
template <>    struct QIntegerForSize<1> { typedef quint8  Unsigned; typedef qint8  Signed; };
template <>    struct QIntegerForSize<2> { typedef quint16 Unsigned; typedef qint16 Signed; };
template <>    struct QIntegerForSize<4> { typedef quint32 Unsigned; typedef qint32 Signed; };
template <>    struct QIntegerForSize<8> { typedef quint64 Unsigned; typedef qint64 Signed; };
#if defined(Q_CC_GNU) && defined(__SIZEOF_INT128__)
template <>    struct QIntegerForSize<16> { __extension__ typedef unsigned __int128 Unsigned; __extension__ typedef __int128 Signed; };
#endif
template <class T> struct QIntegerForSizeof: QIntegerForSize<sizeof(T)> { };
using qsizetype = QIntegerForSizeof<std::size_t>::Signed;
{% endhighlight %}

Si ``std::size_t`` fait 32 bits -> ``qsizetype`` est un ``qint32``.<br>
Si ``std::size_t`` fait 64 bits -> ``qsizetype`` est un ``qint64``.

Il s'agit de l'équivalent Qt de ``std::size_t``, mais avec une différence fondamentale: **il est signé**.
C'est donc un équivalent à [``std::make_signed_t<std::size_t>``](#les-alternatives-signées-en-c-stdssize-et-stdptrdiff_t), c'est à dire **équivalent à [``std::ptrdiff_t``](#stdptrdiff_t-le-type-des-distances)**.

Il bénéficie donc par dépendance au type ``std::size_t`` des mêmes garanties que ``std::ptrdiff_t`` (supporte la même largeur que ``std::ptrdiff_t``).

Mais l'arrivée de ``qsizetype`` vient également avec une **série de problèmes** dont on aimerait bien se passer.

Face à ces **équivalences**, on pourrait utiliser ``qsizetype`` et ``std::diffptr_t`` de manière interchangeable (en décidant d'**ignorer les coûts** liés aux conversions si les types sous-jacents ne sont pas strictement identiques, ce qui en soit **est déjà un problème**).

Mais ``qsizetype`` introduit un grand nombre de **frictions** avec la **STL**, le **langage** et les **appels système**.

Pour vous aider à y voir plus clair, détaillons ces points de friction pour **comprendre les coûts** que ça entraine et **prévenir les risques d'erreurs**:

### La friction entre Qt et la STL

L'existence de ``qsizetype`` crée une "frontière de types" permanente. Puisque Qt a fait le choix du **signé** pour ses conteneurs alors que la STL et le langage (``sizeof``) utilisent le **non-signé**, le développeur se retrouve à devoir arbitrer entre deux mondes incompatibles.

Cela force souvent le développeur à jongler entre trois types pour manipuler des tailles:
- ``std::size_t`` (non-signé standard)
- ``std::ptrdiff_t`` (signé standard)
- ``qsizetype`` (signé Qt).

#### L'enfer des comparaisons mixtes

Dès que vous comparez un index issu d'une recherche Qt avec une taille ou un index standard, le piège se referme.

Le risque est **réel**: une valeur négative de ``qsizetype`` (``-1`` utilisé comme **sentinelle** si non trouvé) [sera interprétée comme une valeur positive gigantesque](#le-mélange-signé--non-signé) lors de la comparaison avec un ``std::size_t``.

{% highlight cpp linenos highlight_lines="9" %}
const auto text = "Hello World!"; // de type const char[7]
const auto string = QString{text};

// indexOf retourne -1 si le mot-clé n'est pas trouvé
auto position = string.indexOf("Word");

// Comparaison d'une valeur signée (qsizetype) avec une non-signée (std::size_t)
// Si le pattern n'est pas trouvé (position = -1), la condition sera VRAIE car -1 > 7 en non-signé.
if (position > std::size(text))
{
	...
}
{% endhighlight %}

> **Activez** le warning ``-Wsign-compare`` pour être avertis de ce genre de problème.
{: .block-warning }

Nous avons détaillé le mécanisme à l'oeuvre [ici](#le-mélange-signé--non-signé).

**Le langage** ayant lui-même **choisi ``std::size_t``** pour exprimer les tailles physiques (**``sizeof``**), cela force à des **conversions incessantes**, **même dans un projet "100% Qt"** (et jusque **dans l'implémentation même du framework**).

#### Frictions avec les appels système et le langage

Les appels système de Qt doivent systématiquement **convertir** leurs types signés **vers les types non-signés** attendus par le système (POSIX ou Windows).

Le jonglage entre ces mondes génère un bruit de code permanent, obligeant à **choisir son camp** et à **caster systématiquement**.

- **Entrées/Sorties (I/O)**: [``QFile::read``](https://doc.qt.io/qt-6/qiodevice.html#read) ou [``QIODevice::write``](https://doc.qt.io/qt-6/qiodevice.html#write) prennent un ``qint64`` (ou ``qsizetype``), alors que les appels système sous-jacents ([``read``](https://man7.org/linux/man-pages/man2/read.2.html), [``write``](https://man7.org/linux/man-pages/man2/write.2.html)) utilisent ``size_t`` (non-signé), impliquant une conversion.

- **Manipulation mémoire**: Des fonctions comme [``QByteArray::fromRawData(const char *data, qsizetype size)``](https://doc.qt.io/qt-6/qbytearray.html#fromRawData) demandent un ``qsizetype``, mais les fonctions système de copie ([``memcpy``](https://man7.org/linux/man-pages/man3/memcpy.3.html)) appelées en interne attendent un ``size_t``.

La documentation de Qt montre d'ailleurs souvent cette gymnastique, où un ``sizeof`` (non-signé) est passé directement à un paramètre ``qsizetype`` (signé).

Par exemple ici, dans l'exemple donné par la documentation Qt sur l'utilisation de [``QByteArray::fromRawData(const char *data, qsizetype size)``](https://doc.qt.io/qt-6/qbytearray.html#fromRawData):
{% highlight cpp highlight_lines="8" %}
static const char mydata[] = {
	'\x00', '\x00', '\x03', '\x84', '\x78', '\x9c', '\x3b', '\x76',
	'\xec', '\x18', '\xc3', '\x31', '\x0a', '\xf1', '\xcc', '\x99',
	...
	'\x6d', '\x5b'
};

// sizeof(mydata) est un std::size_t, converti ici implicitement en qsizetype
QByteArray data = QByteArray::fromRawData(mydata, sizeof(mydata));
{% endhighlight %}

Ceci change **deux fois** le domaine de signe de la valeur (non-signé -> signé -> non-signé en interne lors de l'appel système).

N'est-ce pas absurde d'imposer un type signé pour des tailles, pour finir par le convertir systématiquement ? Introduisant au passage **des risques d'erreurs inutiles** (si on passe une valeur négative en argument) ou **des coûts supplémentaires** si la fonction Qt vérifie systématiquement que la valeur passée n'est pas négative.

**En résumé:** Si vous utilisez Qt, le type ``qsizetype`` est un passage obligé, mais il agit comme un corps étranger dès que vous sollicitez les fonctions de la STL **ou des fonctions système**. L'utilisation de [**``std::ssize()``** (C++20)](https://en.cppreference.com/w/cpp/iterator/size.html) est souvent le meilleur moyen de "ramener" les conteneurs STL dans le monde signé de Qt pour éviter les frictions.

{% highlight cpp %}
QList<int> list = { ... };
std::vector<int> vector = { ... };

// On unifie tout en signé pour éviter les warnings et les bugs de sentinelles
if (std::ssize(list) < std::ssize(vector)) { ... }
{% endhighlight %}

### Faut-il utiliser ``qsizetype``

- **Lorsque vous manipulez des objets Qt**, utiliser les types attendus et retournés par Qt (comme ``qsizetype``) permet d'être sûr de ne pas avoir de conversions. Mais vous serez [parfois obligés de les faire interagir avec des ``std::size_t``](#lenfer-des-comparaisons-mixtes).

- Si votre code n'est **pas fortement lié à Qt**, il est cohérent de confiner la propagation ``qsizetype`` aux strictes parties qui l'utilisent. Et d'utiliser les standards ``std::size_t`` et ``std::diffptr_t`` dans le reste de votre projet lorsque vous avez une **sémantique** de **taille**, de **quantité**, d'**index**, de **différence** ou de **distance**.

Ce n'est **pas une question simple**. Utiliser ``qsizetype`` introduit un grand nombre de **frictions** avec la **STL**, le **langage** et les **appels système**. Et ne pas l'utiliser introduit des conversions (**risques et coût**) entre les types qu'on manipule ``std::size_t``/``std::diffptr_t`` et le type attendu par les fonctions Qt ``qsizetype``.

> **Aucun** des deux choix **n'est idéal et gratuit** (hormis se tourner vers **autre chose que Qt** ?<br>
> A noter que ce n'est **pas le seul point de friction** entre Qt, la STL et le langage. On peut noter aussi le [*copy-on-write*](https://en.wikipedia.org/wiki/Copy-on-write) et les [iterateurs](https://wiki.qt.io/Iterators)).
{: .block-warning }

Une **3ème option** s'offre à nous, car **Qt fait quelques efforts** pour **se conformer au standard** et **se rendre compatible** avec la STL (mais il reste encore beaucoup de chemin):

> Si votre **code est [suffisamment générique](/articles/c++/programmation_generique)**, que vous utilisez les [**customization point**](/articles/c++/customization_point_design) et [**auto**](/articles/c++/auto), la **propagation** de ``qsizetype`` ou de ``std::size_t`` sera **automatique**. Et il sera à vous de bien [utiliser ``std::ssize()``](#frictions-avec-les-appels-système-et-le-langage) lorsque les deux types risquent d'entrer en collision.<br>
> Ceci permettant de **prévenir les risques d'erreur** tout en **délèguant** les questions de **coûts** (liées aux conversions) **à l'appelant** de vos fonctions. Ainsi, votre code deviendrait **agnostique** des types utilisés, **laissant à l'appelant la responsabilité de ces choix**.

---

Aller plus loin:
- [Types Fondamentaux](/articles/c++/fundamental_types)
- [Les Literals](/articles/c++/literals)
- [Pointeurs et références](/articles/c++/pointers_references)
- [Itérateurs](/articles/c++/iterators)
