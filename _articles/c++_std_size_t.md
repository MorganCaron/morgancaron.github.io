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

Avant le C++, le **langage C** a introduit [**``size_t``**](https://en.cppreference.com/w/c/types/size_t.html) (via [``<stddef.h>``](https://en.cppreference.com/w/c/header/stddef.html)) comme **type standard pour toute manipulation de tailles mémoire**. Le standard **POSIX** (fondé sur le C) l'utilise dans ses propres interfaces, notamment via le header système [``<sys/types.h>``](https://man7.org/linux/man-pages/man3/size_t.3type.html).

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
- C'est le type de retour des opérateurs [**``sizeof``**](https://en.cppreference.com/w/c/language/sizeof.html), [**``_Alignof``**](https://en.cppreference.com/w/c/language/_Alignof.html) (introduit en C11) et [**``alignof``**](https://en.cppreference.com/w/c/language/alignof.html) (mot-clé préféré depuis C23).

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

if (i < n)
{
	// On s'attend à true, mais ce sera false
}
{% endhighlight %}

Lorsqu'un type signé et un type non signé sont utilisés dans une opération (ici i < n), C++ applique les [**usual arithmetic conversions**](https://en.cppreference.com/w/cpp/language/usual_arithmetic_conversions.html).<br>
Le type signé (``int``) est converti vers le type non-signé (``std::size_t``). ``i = -1`` devient une valeur non-signée sur 64 bits, ``std::size_t{-1}``. La valeur ``-1`` devient alors la valeur maximale de ``std::size_t`` par overflow (``2⁶⁴-1``), ce qui est bien supérieur à 10.

> C'est d'ailleurs ce que souligne la règle [**ES.100**](#ne-mélangez-pas-signé-et-non-signé-es100) des C++ Core Guidelines: **"Don't mix signed and unsigned arithmetic"**.

Ca aura donc l'effet suivant:
{% highlight cpp highlight_lines="4" %}
int i = -1;
std::size_t n = 10;

if (static_cast<std::size_t>(i) < n)
{
	// On s'attend à true, mais ce sera false
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

Le type [**``ssize_t``**](https://man7.org/linux/man-pages/man3/size_t.3type.html) est un type historique des systèmes **POSIX** (Linux/Unix). Il est couramment utilisé dans les fonctions système (comme [``read``](https://man7.org/linux/man-pages/man2/read.2.html) ou [``write``](https://man7.org/linux/man-pages/man2/write.2.html)) pour retourner soit une taille, soit une erreur (via une valeur négative).

| type      | type réel                | Portabilité                         |
| --------- | :----------------------: | ----------------------------------- |
| `size_t`  | *implementation-defined* | oui (standard, ISO&nbsp;C et POSIX) |
| `ssize_t` | *implementation-defined* | non (POSIX uniquement)              |
| `SIZE_T`  | ULONG_PTR                | non (API Windows)                   |
| `SSIZE_T` | ULONG_PTR                | non (API Windows)                   |

``ssize_t`` n'est donc **pas un bon candidat** pour représenter une **différence/distance** en C.

### ``ptrdiff_t``: Le type des distances

Le type [**``ptrdiff_t``**](https://en.cppreference.com/w/c/types/ptrdiff_t.html) est l'alias standard pour un type **entier signé** représentant le résultat de la soustraction de deux pointeurs (``ptr2 - ptr1``).

Il peut être formellement défini en C via l'expression suivante:
{% highlight cpp %}
typedef typeof((int*)nullptr - (int*)nullptr) ptrdiff_t;
{% endhighlight %}

Comme le laisse penser son nom, c'est **sémantiquement** son sens premier. Mais il est également utilisé pour représenter une **différence entre deux index**, tant que celle-ci reste comprise entre [**``PTRDIFF_MIN`` et ``PTRDIFF_MAX``**](https://en.cppreference.com/w/c/types/limits.html).

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
- ``ptrdiff_t`` est [garanti de faire au moins **17 bits** avant C23, et au moins **16 bits** à partir de C23](https://en.cppreference.com/w/c/types/ptrdiff_t.html). Cette différence permet **historiquement** de garantir que **la différence entre deux adresses** peut être stockée dans un type signé **sans perte** de précision (en réservant un bit supplémentaire pour le signe). **Ce n'est plus garanti**.

Mais concrètement sur les architectures 64 bits modernes, [``size_t``](#héritage-du-c-size_t) et [``ptrdiff_t``](#ptrdiff_t-le-type-des-distances) sont définis sur [64 bits](#dépendance-à-labi-et-au-modèle-de-données).

Il n'est donc **pas garanti** que tout ``size_t`` tienne toujours dans un ``ptrdiff_t``, même si ce n'est pas un problème car ``ptrdiff_t`` a les garanties suivantes:
- Il est conçu pour contenir la différence entre deux pointeurs pointant **dans le même objet ou tableau**.
- Le standard impose que ``ptrdiff_t`` soit **suffisamment grand** pour représenter **toutes ces différences** légales (n'excédant pas les capacités offertes par l'architecture).

Même si ``size_t`` peut représenter des valeurs supérieures à ``PTRDIFF_MAX`` sur certaines plateformes, **aucune différence de pointeurs légale** dans le même objet **ne pourra dépasser ``PTRDIFF_MAX``**. Les différences de pointeurs sont **limitées par la taille maximale d’un objet contigu en mémoire**.

## Les alternatives signées en C++: ``std::ssize`` et ``std::ptrdiff_t``

Contrairement à une idée reçue, **il n'existe pas de type ``std::ssize_t``** dans le standard C++. Le comité C++ a jugé qu'un tel type **serait redondant** avec [``std::ptrdiff_t``](#stdptrdiff_t-le-type-des-distances).

Le standard a choisi **une fonction plutôt qu'un type**. [**``std::ssize()``**](https://en.cppreference.com/w/cpp/iterator/size.html) ([**P1227R2**](https://wg21.link/p1227r2)) retourne l'**équivalent signé** de la taille du conteneur. Plus précisément, son type de retour est: ``std::common_type_t<std::ptrdiff_t, std::make_signed_t<typename C::size_type>>``.

Il est également possible d'obtenir l'équivalent signé d'un type via le trait de type [**``std::make_signed_t``**](https://en.cppreference.com/w/cpp/types/make_signed):
{% highlight cpp %}
using signed_size_t = std::make_signed_t<std::size_t>;
{% endhighlight %}
Ce type ``signed_size_t`` peut (par abus de langage) être considéré comme un **équivalent à ``std::ptrdiff_t``** (bien qu'en pratique ce soit souvent le cas), ce n'est cependant pas garanti. ``std::ptrdiff_t`` étant défini par la norme selon une suite d'exigences, ça laisse une marge de manoeuvre aux compilateurs quant à la définition concrète du type sous-jacent.

{% highlight cpp %}
// std::ssize renvoie un type signé
for (auto i = std::ssize(v) - 1; i >= 0; --i) { ... }
{% endhighlight %}

### ``std::ptrdiff_t``: Le type des distances

Comme [``ptrdiff_t``](#ptrdiff_t-le-type-des-distances) en C, le type [**``std::ptrdiff_t``**](https://en.cppreference.com/w/cpp/types/ptrdiff_t.html) est l'alias standard pour un type **entier signé** en C++. Type adapté pour représenter n'importe quelle soustraction entre deux pointeurs (``ptr2 - ptr1``).

Il peut être formellement défini via l'expression suivante:
{% highlight cpp %}
using ptrdiff_t = decltype(static_cast<int*>(nullptr) - static_cast<int*>(nullptr));
{% endhighlight %}

| type | type réel | Portabilité | Usage sémantique |
| :--- | :---: | :--- | :--- |
| **``std::size_t``** | *implementation-defined* | oui (standard ISO&nbsp;C++) | **Indexes**, **quantités** et **tailles** d'objets dans un conteneur ou tableau |
| **``std::ptrdiff_t``** | *implementation-defined* | oui (standard ISO&nbsp;C++) | **Différences** entre **deux pointeurs** |

Sa largeur est garantie de faire au moins **17 bits** ([The bit width of std::ptrdiff_t is not less than 17. (since C++11)](https://en.cppreference.com/w/cpp/types/ptrdiff_t.html))

> Concernant les **plages de valeurs** de ``std::size_t`` et ``std::ptrdiff_t``, le standard C++ donne les mêmes garanties que le standard C.<br>
> ``std::size_t`` n'est **pas formellement compris** dans ``std::ptrdiff_t``, mais ce n'est **pas un problème** pour autant. Nous en avons parlé [**ici**](#limitation-de-la-plage-de-valeurs).

### ``std::uintptr_t`` et ``std::intptr_t``

Bien que ``std::size_t`` soit souvent utilisé pour des **offset mémoire** au sein d'un même objet (comme avec la macro [``offsetof``](https://en.cppreference.com/w/cpp/types/offsetof.html) qui donne un ``std::size_t``), il n'est pas destiné à faire des calculs d'adresses complexes. Pour convertir un pointeur en entier afin d'effectuer de l'arithmétique bas niveau (masquage de bits, calcul d'alignement, etc), préférez [**``std::uintptr_t``**](https://en.cppreference.com/w/cpp/types/integer.html) ou [**``std::intptr_t``**](https://en.cppreference.com/w/cpp/types/integer.html), qui est garanti d'être assez large pour contenir un pointeur.

| type | type réel | Portabilité | Usage sémantique |
| :--- | :---: | :--- | :--- |
| **``std::size_t``** | *implementation-defined* | oui (standard ISO&nbsp;C++) | **Indexes**, **quantités** et **tailles** d'objets dans un conteneur ou tableau |
| **``std::ptrdiff_t``** | *implementation-defined* | oui (standard ISO&nbsp;C++) | **Différences** entre **deux pointeurs** |
| **``std::uintptr_t``** | *implementation-defined* | oui (standard ISO&nbsp;C++) | **Arithmétique sur pointeurs** |
| **``std::intptr_t``** | *implementation-defined* | oui (standard ISO&nbsp;C++) | **Arithmétique** sur pointeurs avec valeurs **négatives** |

## Dans la STL (Standard Template Library)

Les conteneurs de la STL (``vector``, ``list``, ``string``, etc) définissent des **alias internes** pour **garantir la généricité** du code.

Ils sont **visibles en public** dans les classes, et dans presque toutes les **signatures de fonctions** membres:

- **``T::size_type``**: Type non signé pour représenter le **nombre d'éléments stockés**. C'est notamment le type de retour de la méthode [**``std::vector<T>::size()``**](https://en.cppreference.com/w/cpp/container/vector/size) et le type attendu par l'opérateur [**``std::vector<T>::operator[]``**](https://en.cppreference.com/w/cpp/container/vector/operator_at). Ce type est très souvent ``std::size_t`` par défaut.

- **``T::difference_type``**: Type signé pour les distances. C'est le type retourné par l'opérateur de **soustraction entre deux itérateurs** (``it2 - it1``) ou par la fonction [**``std::distance``**](https://en.cppreference.com/w/cpp/iterator/distance). Ce type est très souvent ``std::ptrdiff_t`` par défaut.

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

### Valeur sentinelle de ``std::string``


La fonction [``std::string::find``](https://en.cppreference.com/w/cpp/string/basic_string/find.html) retourne une valeur de type ``std::string::size_type``. Cet alias correspond à ``std::allocator_traits<Allocator>::size_type``, dont le type réel est **systématiquement [``std::size_t``](https://en.cppreference.com/w/cpp/memory/allocator.html)** pour [l'allocateur par défaut](https://en.cppreference.com/w/cpp/memory/allocator.html).

> Pour être exact, ``std::string`` est un alias de la classe template [``std::basic_string<CharT, Traits, Allocator>``](https://en.cppreference.com/w/cpp/string/basic_string.html). Cette précision est utile car les types que nous allons manipuler en dépendent.

Cette fonction [``std::string::find``](https://en.cppreference.com/w/cpp/string/basic_string/find.html) retourne la **position de l'élément trouvé**:

{% highlight cpp %}
auto string = std::string{"Hello World!"};
std::size_t position = string.find("World"); // position vaut 5
{% endhighlight %}

La STL propose une **valeur sentinelle** pour indiquer que **la chaîne recherchée n'a pas été trouvée**:
{% highlight cpp linenos highlight_lines="4" %}
auto string = std::string{"Hello World!"};
std::size_t position = string.find("Word"); // position vaut std::string::npos

if (position == std::string::npos)
{
	std::println("Chaîne non trouvée");
}
{% endhighlight %}

[**``std::string::npos``**](https://en.cppreference.com/w/cpp/string/basic_string/npos) est une constante de type **``std::size_t``**. Cette **valeur sentinelle** vaut **``-1``**.

``-1`` dans un type non-signé ? C'est parfaitement légal: [dans l'**arithmétique non signée**, les **overflow/underflow** ont la **garantie de boucler**](#le-mélange-signé--non-signé). ``-1`` devient donc **la plus grande valeur possible** de ``std::size_t`` (qu'on ne peut pas formellement citer car le standard [ne garantit pas de largeur exacte pour ce type](#dépendance-à-labi-et-au-modèle-de-données)).

Ce mécanisme, parfois source de bugs, est utilisé ici pour **garantir une valeur sentinelle impossible à atteindre** pour une taille réelle de chaîne.

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

La taille de ``qsizetype`` est directement définie sur celle de ``std::size_t`` (``sizeof(std::size_t)``).

Si ``std::size_t`` fait 32 bits -> ``qsizetype`` est un ``qint32``.<br>
Si ``std::size_t`` fait 64 bits -> ``qsizetype`` est un ``qint64``.

Il s'agit de l'équivalent Qt de ``std::size_t``, mais avec une différence fondamentale: **il est signé**.

Dans la plupart des plateformes modernes, ``qsizetype`` est identique à ``std::ptrdiff_t``, mais cette équivalence n'est **pas garantie par le standard**. En revanche, ``qsizetype`` possède systématiquement la **même largeur** (nombre de bits) que ``std::size_t``, c'est donc un équivalent à [``std::make_signed_t<std::size_t>``](#les-alternatives-signées-en-c-stdssize-et-stdptrdiff_t).

### Un choix de conception contestable

Le choix de Qt d'utiliser un **type signé** pour des tailles est **souvent critiqué**. Bien que cela permette l'utilisation de valeurs sentinelles (comme ``-1``), cela autorise également des **états sémantiquement absurdes**: rien n'interdit techniquement d'écrire ``qsizetype n = -5;``, ce qui n'a **aucun sens** pour une mesure de taille physique.

Ce choix de conception introduit une **dissonance sémantique** permanente dès que l'**on sort de l'écosystème de Qt**. Le développeur doit jongler entre **deux modèles mentaux opposés**: l'un où une **valeur négative** est une **erreur légitime** (**Qt**), et l'autre où une taille est par **définition une quantité absolue non-signée** (la **STL** et le langage (**``sizeof``**)). Cette ambiguïté rend chaque interaction propice aux bugs de signe.

### La friction entre Qt et la STL

L'existence de ``qsizetype`` crée une "frontière de types" permanente. Puisque Qt a fait le choix du **signé** pour ses conteneurs alors que la STL et le langage (``sizeof``) utilisent le **non-signé**, le développeur se retrouve à devoir arbitrer entre **deux mondes incompatibles**.

Cela force souvent le développeur à **jongler entre trois types** pour manipuler des **tailles**:
- ``std::size_t`` (non-signé standard)
- ``std::ptrdiff_t`` (signé standard)
- ``qsizetype`` (signé Qt).

#### Les comparaisons mixtes

Dès que vous **comparez un index** issu d'une recherche **Qt** avec une taille ou un index **standard**, le piège se referme.

Le risque est qu'une valeur "non trouvée" (``-1`` utilisé comme **sentinelle**) [soit interprétée comme une valeur positive gigantesque](#le-mélange-signé--non-signé) lors de la comparaison avec un ``std::size_t``.

{% highlight cpp linenos highlight_lines="8" %}
QString url = "/api/v1/resource/data"; // Pas de paramètres '?' ici
std::size_t MaxPathLength = 128;

auto queryStart = url.indexOf('?');

// Comparaison entre un qsizetype (signé) et un std::size_t (non-signé)
// Si '?' n'est pas trouvé (queryStart = -1), la condition sera VRAIE car -1 > 128 en non-signé
if (queryStart > MaxPathLength)
{
	// On rejette l'URL car on croit que le chemin est trop long !
	return Error::BadRequest;
}
{% endhighlight %}

> **Activez** le warning ``-Wsign-compare`` pour être avertis de ce genre de problème, car c'est l'une des sources de bugs les plus fréquentes en C++.
{: .block-warning }

Nous avons détaillé le mécanisme à l'oeuvre [ici](#le-mélange-signé--non-signé).

**Le langage** ayant lui-même **choisi ``std::size_t``** pour exprimer les tailles physiques (**``sizeof``**), cela force à des **conversions incessantes**, **même dans un projet "100% Qt"** (et jusque **dans l'implémentation même du framework**).

#### Comparaisons sûres (C++20)

Pour résoudre définitivement ce problème sans conversion manuelle risquée, le C++20 a introduit une famille de fonctions dans le header ``<utility>``:
- [``std::cmp_equal``](http://en.cppreference.com/w/cpp/utility/intcmp.html)
- [``std::cmp_not_equal``](http://en.cppreference.com/w/cpp/utility/intcmp.html)
- [``std::cmp_less``](http://en.cppreference.com/w/cpp/utility/intcmp.html)
- [``std::cmp_less_equal``](http://en.cppreference.com/w/cpp/utility/intcmp.html)
- [``std::cmp_greater``](http://en.cppreference.com/w/cpp/utility/intcmp.html)
- [``std::cmp_greater_equal``](http://en.cppreference.com/w/cpp/utility/intcmp.html)

Ces fonctions appliquent une logique correcte selon le signe de chaque valeur, **empêchant les conversions implicites dangereuses**.

{% highlight cpp %}
QString url = "/api/v1/resource/data"; // Pas de paramètres '?' ici
std::size_t maxPathLength = 128;

auto queryStart = url.indexOf('?');

// Solution moderne et sûre:
if (std::cmp_greater(queryStart, maxPathLength))
{
	// La comparaison est mathématiquement correcte: -1 > 128 est FAUX
	return Error::BadRequest;
}
{% endhighlight %}

#### L'asymétrie des conversions

Le passage d'un type à l'autre n'est jamais neutre, car leurs capacités diffèrent.

**Sens 1: De Qt vers le standard (``qsizetype`` => ``std::size_t``)**

La conversion est techniquement sûre pour toutes les tailles car la plage positive de ``qsizetype`` tient toujours dans un ``std::size_t``. Cependant, elle **détruit la sémantique d'erreur**:
{% highlight cpp %}
qsizetype qtSize = -1; // En Qt, la sentinelle -1 signifie sémantiquement "non trouvé" ou "erreur"
std::size_t stdSize = qtSize;

// stdSize vaut désormais la plus grande valeur stockable dans un std::size_t
// L'erreur est devenue une taille gigantesque "valide"
{% endhighlight %}

**Sens 2: Du standard vers Qt (``std::size_t`` => ``qsizetype``)**

C'est ici que le risque d'**overflow** est le plus critique. Si vous manipulez une donnée dépassant la moitié de la mémoire adressable (ex: un énorme fichier), la conversion produira une valeur négative:
{% highlight cpp %}
// Imaginons un buffer de 9 exaoctets sur un système très spécifique
std::size_t hugeSize = 9'000'000'000'000'000'000uz;
qsizetype qtSize = hugeSize;

// qtSize devient négatif par overflow
// Qt croira que votre buffer est une erreur ou une chaîne vide
{% endhighlight %}

#### Interopérabilité des conteneurs

Ces frictions obligent à une vigilance constante lors de l'interaction entre les deux mondes. Tenter de réserver de la place dans une ``QList`` en se basant sur la taille d'un ``std::vector`` (ou inversement) génère systématiquement un warning.

Par exemple, si nous voulons dimensionner un ``std::vector`` par rapport à la taille d'une ``QList``:
{% highlight cpp %}
std::vector<int> v = { ... };
QList<int> list;

// Warning: conversion de size_t vers qsizetype
// Le compilateur avertit que v.size() pourrait ne pas tenir dans list
list.reserve(v.size()); 
{% endhighlight %}

#### Frictions avec les appels système et le langage

Les appels système de Qt doivent systématiquement **convertir** leurs types signés **vers les types non-signés** attendus par le système (POSIX ou Windows).

Le jonglage entre ces mondes génère un bruit de code permanent, obligeant à **choisir son camp** et à **caster systématiquement**.

- **Entrées/Sorties (I/O)**: [``QFile::read``](https://doc.qt.io/qt-6/qiodevice.html#read) ou [``QIODevice::write``](https://doc.qt.io/qt-6/qiodevice.html#write) prennent un ``qint64`` (ou ``qsizetype``), alors que les appels système sous-jacents ([``read``](https://man7.org/linux/man-pages/man2/read.2.html), [``write``](https://man7.org/linux/man-pages/man2/write.2.html)) utilisent ``size_t`` (non-signé), impliquant une conversion.

- **Manipulation mémoire**: Des fonctions comme [``QByteArray::fromRawData(const char *data, qsizetype size)``](https://doc.qt.io/qt-6/qbytearray.html#fromRawData) demandent un ``qsizetype``, mais les fonctions système de copie ([``memcpy``](https://man7.org/linux/man-pages/man3/memcpy.3.html)) appelées en interne attendent un ``size_t``.

La documentation de Qt montre d'ailleurs souvent cette gymnastique, où un ``sizeof`` (non-signé) est passé directement à un paramètre ``qsizetype`` (signé), comme dans l'exemple de [``QByteArray::fromRawData(const char *data, qsizetype size)``](https://doc.qt.io/qt-6/qbytearray.html#fromRawData):
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

### Faut-il utiliser ``qsizetype`` (Qt) ?

Si vous utilisez Qt, le type ``qsizetype`` est un passage obligé, mais il agit comme un corps étranger dès que vous sollicitez les fonctions de la STL **ou des fonctions système**. L'utilisation de [**``std::ssize()``** (C++20)](https://en.cppreference.com/w/cpp/iterator/size.html) est souvent le meilleur moyen de "ramener" les conteneurs STL dans le monde signé de Qt pour éviter les frictions.

{% highlight cpp %}
QList<int> list = { ... };
std::vector<int> vector = { ... };

// On unifie tout en signé pour éviter les warnings et les bugs de sentinelles
if (std::ssize(list) < std::ssize(vector)) { ... }
{% endhighlight %}

**Si votre code n'est pas fortement lié à Qt**, confinez ``qsizetype`` aux strictes parties qui l'utilisent. Préférez les standards ``std::size_t`` et ``std::ptrdiff_t``.

Mais comme nous l'avons vu, ce n'est **pas une question simple**. Utiliser ``qsizetype`` introduit un grand nombre de **frictions** avec la **STL**, le **langage** et les **appels système**. Mais ne pas l'utiliser introduit des conversions incessantes entre vos types standards et les types attendus par Qt.

> **Aucun** des deux choix **n'est idéal et gratuit** (hormis se tourner vers **autre chose que Qt** ?).
> A noter que ce n'est **pas le seul point de friction**. On peut noter aussi le [*copy-on-write*](https://en.wikipedia.org/wiki/Copy-on-write) et les [itérateurs](https://wiki.qt.io/Iterators) propres à Qt.
{: .block-warning }

Une **3ème option** s'offre à nous, car **Qt fait quelques efforts** pour **se conformer au standard** et **se rendre compatible** avec la STL (bien qu'il reste encore du chemin):

> Si votre **code est [suffisamment générique](/articles/c++/programmation_generique)**, que vous utilisez les [**customization points**](/articles/c++/customization_point_design), [**auto**](/articles/c++/auto) et les [**comparaisons sûres**](#comparaisons-sûres-c20), la **propagation** du type correct sera **automatique** et ses manipulations seront **sûres**.
> 
> Cette approche permet de **prévenir les risques d'erreur** tout en **déléguant** la responsabilité du choix des types à l'appelant. Votre code devient ainsi **agnostique** et plus **résilient**.

## Les recommandations contradictoires de C++ Core Guidelines

Les [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines) reconnaissent ce conflit historique entre la STL et les besoins de calcul.

### Ne mélangez pas signé et non signé (ES.100)

Le principe est simple: Ne mélangez pas l'arithmétique signée et non-signée ([**Don't mix signed and unsigned arithmetic**](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#res-mix)). Le mélange provoque des **conversions silencieuses** et des bugs difficiles à tracer. Nous l'avons illustré avec les [frictions de Qt](#les-comparaisons-mixtes).

### Préférez le signé pour les index (ES.107)

Ces guidelines recommandent de [**préférer les types signés pour les indices de tableaux**](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines#es107-dont-use-unsigned-for-subscripts-prefer-gslindex).

Comme nous l'avons vu avec [les boucles décrémentales](#lunderflow-dans-les-boucles) qui peuvent provoquer un **underflow** si l'index est non-signé, cette guideline vise à prévenir ce genre d'erreur.

### La position ambiguë sur ``size_t``

Les guidelines se retrouvent ici dans une impasse: elles recommandent le signé pour les index (ES.107) tout en devant composer avec ``std::size_t`` imposé par la STL pour les tailles de conteneurs et le langage (``sizeof``).

En effet, les index sont **très massivement** affectés ou comparés avec des **tailles**, qui sont **non-signées**. Causant un nombre considérable d'interactions entre des valeurs signées et non-signées dans un programme. Cette guideline rentre donc complètement en **contradiction** avec la 1ère ([ES.100](#ne-mélangez-pas-signé-et-non-signé-es100)).

C'est exactement la **même dissonance** que celle rencontrée [**avec Qt**](#le-cas-particulier-de-qt-qsizetype), montrant que le débat entre signé et non-signé pour les tailles reste l'un des points **les plus clivants du C++**.

De nombreux développeurs (dont vous aurez deviné, je fais partie) rangent les **index** et les **tailles** dans **la même arithmétique non-signée** (``std::size_t``). Réservant les index signés **uniquement aux [boucles décrémentales](#lunderflow-dans-les-boucles)** (en priorisant une autre forme d'écriture pour éviter d'y avoir recours).

---

Aller plus loin:
- [Types Fondamentaux](/articles/c++/fundamental_types)
- [Les Literals](/articles/c++/literals)
- [Pointeurs et références](/articles/c++/pointers_references)
- [Itérateurs](/articles/c++/iterators)
