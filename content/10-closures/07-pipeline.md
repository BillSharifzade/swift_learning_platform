---
title: Подборка товаров
concept: Цепочки методов, flatMap, prefix
---

## @description

### Контекст
На главной странице «Ярмарки» есть блок «Подборка недели» — несколько лучших товаров со всей площадки. А в боковом меню — список категорий.

Сложность в том, что товары хранятся по продавцам: у каждого своя витрина. Менеджер продукта описывает подборку так: «Собери товары всех продавцов, убери те, которых нет в наличии, расставь по рейтингу и возьми первые несколько. На экран нужны только названия». А для меню: «Все категории, которые есть на площадке, без повторов и по алфавиту».

Тимлид добавляет: «Каждый шаг ты уже умеешь делать. Осталось выстроить их в цепочку».

### Новое в Swift
**`flatMap` — собрать вложенные списки в один.** Возьмём заказы, каждый из которых пришёл несколькими посылками:

```swift
struct Order {
    let number: String
    let parcels: [String]   // трек-номера посылок
}

let orders = [
    Order(number: "ЯР-1001", parcels: ["RU-501", "RU-502"]),
    Order(number: "ЯР-1002", parcels: ["RU-503"])
]
```

`map` вернёт массив массивов — по одному списку на заказ:

```swift
let nested = orders.map { $0.parcels }
// [["RU-501", "RU-502"], ["RU-503"]] — тип [[String]]
```

А `flatMap` склеит эти списки в один общий:

```swift
let allParcels = orders.flatMap { $0.parcels }
// ["RU-501", "RU-502", "RU-503"] — тип [String]
```

Замыкание в `flatMap` возвращает массив для каждого элемента, а метод выкладывает их содержимое подряд в один результат.

**`prefix` — взять первые несколько.** `prefix(2)` возвращает первые два элемента. Если элементов меньше, вернёт сколько есть, а для `prefix(0)` — пустой результат:

```swift
let first = allParcels.prefix(2)   // "RU-501", "RU-502"
```

У `prefix` есть особенность: он возвращает не массив, а **срез** (`ArraySlice`) — окошко в исходный массив. Со срезом работают все знакомые методы: `map`, `filter`, `count`. А если из функции нужно вернуть именно массив, срез оборачивают: `Array(allParcels.prefix(2))`.

**Цепочки.** `filter`, `sorted`, `map` и другие методы возвращают новую коллекцию. Значит, у результата можно сразу вызвать следующий метод — и так несколько раз подряд. Каждый шаг получает то, что вернул предыдущий.

Вот курьеру нужны адреса двух ближайших оплаченных доставок:

```swift
struct Delivery {
    let address: String
    let minutes: Int     // сколько минут ехать
    let isPaid: Bool
}

let deliveries = [
    Delivery(address: "ул. Садовая, 12", minutes: 25, isPaid: true),
    Delivery(address: "пр. Мира, 40", minutes: 10, isPaid: false),
    Delivery(address: "ул. Лесная, 3", minutes: 15, isPaid: true),
    Delivery(address: "ул. Речная, 8", minutes: 40, isPaid: true)
]

let nextStops = deliveries
    .filter { $0.isPaid }
    .sorted { $0.minutes < $1.minutes }
    .prefix(2)
    .map { $0.address }
// ["ул. Лесная, 3", "ул. Садовая, 12"]
```

Читается сверху вниз, как рецепт: «оплаченные, по времени в пути, первые две, только адреса». Каждый шаг переносят на новую строку и начинают с точки — так цепочку легко читать. После `.map` получился обычный массив `[String]`, хотя перед ним стоял срез.

> ⚠️ Порядок шагов важен. Если сначала взять `prefix(2)`, а потом отфильтровать, может остаться одна доставка или ни одной.

### Задача
В редакторе есть структуры `Product` и `Seller` (продавец: название магазина и его товары) и заготовки трёх функций. Допиши их тела. Циклы не используй.

1. `allProducts(_:)` — возвращает товары всех продавцов одним массивом: сначала все товары первого продавца в их порядке, потом второго и так далее. Используй `flatMap`.
2. `weeklyPicks(_:limit:)` — возвращает названия товаров для подборки недели. Берутся товары всех продавцов, остаются только те, что в наличии. Они сортируются по рейтингу от высокого к низкому, и из них берутся первые `limit` штук. Если подходящих товаров меньше, чем `limit`, возвращаются все. Используй цепочку с `filter`, `sorted`, `prefix` и `map`.
3. `categoryMenu(_:)` — возвращает категории всех товаров всех продавцов: без повторов и по алфавиту. Сюда входят и категории товаров, которых нет в наличии.

Функции 2 и 3 могут вызывать `allProducts`.

### Пример
```swift
let sellers = [
    Seller(shopName: "Тёплый дом", products: [
        Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9),
        Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: false, rating: 4.6)
    ]),
    Seller(shopName: "Пасека у реки", products: [
        Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)
    ])
]

allProducts(sellers)            // плед, свеча, мёд
weeklyPicks(sellers, limit: 5)  // ["Плед вязаный", "Мёд липовый"]
weeklyPicks(sellers, limit: 1)  // ["Плед вязаный"]
categoryMenu(sellers)           // ["Дом", "Еда"]
```

## @starter
```swift
struct Product {
    let name: String
    let price: Int
    let category: String
    let inStock: Bool
    let rating: Double
}

// Продавец и его витрина
struct Seller {
    let shopName: String
    let products: [Product]
}

// 1. Товары всех продавцов одним списком
func allProducts(_ sellers: [Seller]) -> [Product] {

}

// 2. Подборка недели: названия лучших товаров в наличии
func weeklyPicks(_ sellers: [Seller], limit: Int) -> [String] {

}

// 3. Меню категорий: без повторов, по алфавиту
func categoryMenu(_ sellers: [Seller]) -> [String] {

}
```

## @solution
```swift
struct Product {
    let name: String
    let price: Int
    let category: String
    let inStock: Bool
    let rating: Double
}

// Продавец и его витрина
struct Seller {
    let shopName: String
    let products: [Product]
}

// 1. Товары всех продавцов одним списком
func allProducts(_ sellers: [Seller]) -> [Product] {
    return sellers.flatMap { $0.products }
}

// 2. Подборка недели: названия лучших товаров в наличии
func weeklyPicks(_ sellers: [Seller], limit: Int) -> [String] {
    return allProducts(sellers)
        .filter { $0.inStock }
        .sorted { $0.rating > $1.rating }
        .prefix(limit)
        .map { $0.name }
}

// 3. Меню категорий: без повторов, по алфавиту
func categoryMenu(_ sellers: [Seller]) -> [String] {
    let categories = allProducts(sellers).map { $0.category }
    return Set(categories).sorted()
}
```

## @tests
```swift
let __t_home = Seller(shopName: "Тёплый дом", products: [
    Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9),
    Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: false, rating: 4.6),
    Product(name: "Подушка льняная", price: 1200, category: "Дом", inStock: true, rating: 4.5)
])
let __t_apiary = Seller(shopName: "Пасека у реки", products: [
    Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4),
    Product(name: "Варенье малиновое", price: 450, category: "Еда", inStock: false, rating: 4.8)
])
let __t_beads = Seller(shopName: "Бусинка", products: [
    Product(name: "Серьги из бисера", price: 1500, category: "Украшения", inStock: true, rating: 4.7),
    Product(name: "Браслет из янтаря", price: 2100, category: "Украшения", inStock: true, rating: 4.8)
])
let __t_newShop = Seller(shopName: "Новая лавка", products: [])
let __t_sellers = [__t_home, __t_apiary, __t_newShop, __t_beads]
func __t_names(_ list: [Product]) -> [String] { list.map { $0.name } }

__eq("allProducts: товары всех продавцов по порядку", __t_names(allProducts(__t_sellers)),
     ["Плед вязаный", "Свеча соевая", "Подушка льняная", "Мёд липовый", "Варенье малиновое", "Серьги из бисера", "Браслет из янтаря"],
     hint: "Выложи подряд товары каждого продавца: сначала первого, потом второго. flatMap { $0.products } делает именно это")
__eq("allProducts: один продавец", __t_names(allProducts([__t_beads])), ["Серьги из бисера", "Браслет из янтаря"])
__eq("allProducts: продавец без товаров", __t_names(allProducts([__t_newShop])), [])
__eq("allProducts: нет продавцов", __t_names(allProducts([])), [])

__eq("weeklyPicks: три лучших товара в наличии", weeklyPicks(__t_sellers, limit: 3),
     ["Плед вязаный", "Браслет из янтаря", "Серьги из бисера"],
     hint: "Сначала убери товары не в наличии, потом отсортируй по рейтингу по убыванию и только потом бери первые limit штук")
__eq("weeklyPicks: варенье с рейтингом 4.8 не в наличии и в подборку не попадает", weeklyPicks(__t_sellers, limit: 2),
     ["Плед вязаный", "Браслет из янтаря"],
     hint: "В подборку попадают только товары, у которых inStock равно true")
__eq("weeklyPicks: limit больше, чем товаров в наличии", weeklyPicks(__t_sellers, limit: 10),
     ["Плед вязаный", "Браслет из янтаря", "Серьги из бисера", "Подушка льняная", "Мёд липовый"],
     hint: "Если подходящих товаров меньше, чем limit, верни все — prefix сам с этим справится")
__eq("weeklyPicks: limit 1 — один лучший товар", weeklyPicks(__t_sellers, limit: 1), ["Плед вязаный"])
__eq("weeklyPicks: limit 0 — пустая подборка", weeklyPicks(__t_sellers, limit: 0), [])
__eq("weeklyPicks: у пасеки в наличии только мёд", weeklyPicks([__t_apiary], limit: 3), ["Мёд липовый"])
__eq("weeklyPicks: у продавца нет товаров", weeklyPicks([__t_newShop], limit: 3), [])
__eq("weeklyPicks: нет продавцов", weeklyPicks([], limit: 3), [])

__eq("categoryMenu: три категории по алфавиту", categoryMenu(__t_sellers), ["Дом", "Еда", "Украшения"],
     hint: "Собери категории всех товаров, убери повторы через Set и отсортируй")
__eq("categoryMenu: порядок продавцов не важен", categoryMenu([__t_beads, __t_apiary]), ["Еда", "Украшения"],
     hint: "Категории должны идти по алфавиту, а не в порядке продавцов")
__eq("categoryMenu: товары не в наличии тоже дают категорию", categoryMenu([Seller(shopName: "Сад", products: [
    Product(name: "Семена базилика", price: 90, category: "Сад", inStock: false, rating: 4.2)
])]), ["Сад"])
__eq("categoryMenu: у одного продавца одна категория без повторов", categoryMenu([__t_home]), ["Дом"])
__eq("categoryMenu: нет товаров — нет категорий", categoryMenu([__t_newShop]), [])
```

## @rules
- mustnot: /\b(for|while|repeat)\b/ :: Циклы в этой задаче не нужны: собери результат цепочкой методов.
- mustnot: /\.forEach\b/ :: Обойдись без перебора элементов: собери результат цепочкой методов.
- must: /\.flatMap\s*[{(]/ :: Чтобы собрать товары всех продавцов в один список, используй `flatMap`.
- must: /\.filter\s*[{(]/ :: Чтобы оставить только товары в наличии, используй `filter`.
- must: /\.sorted\s*(\{|\(\s*by\s*:)/ :: Чтобы расставить товары по рейтингу, используй `sorted` с замыканием.
- must: /\.prefix\s*\(/ :: Чтобы взять первые `limit` товаров, используй `prefix(limit)`.
- must: /\.map\s*[{(]/ :: Чтобы оставить от товаров только названия или категории, используй `map`.

## @hint1
Начни с `allProducts`: у каждого продавца есть массив `products`, и все эти массивы нужно выложить подряд в один. Это работа `flatMap`. Замыкание возвращает массив товаров очередного продавца.

`weeklyPicks` — цепочка из пяти шагов. Сначала получи все товары вызовом `allProducts`. Дальше каждый шаг — на своей строке и начинается с точки. Оставь только товары в наличии. Расставь их по рейтингу так, чтобы высокий был первым. Возьми первые `limit` штук. Наконец, преврати каждый товар в его название. Порядок шагов важен: отбирать первые нужно уже после фильтра и сортировки.

`categoryMenu` — в два шага. Сначала из всех товаров получи массив их категорий. В нём будут повторы. Потом вспомни модуль про коллекции: множество `Set` хранит каждое значение один раз, и его можно создать из массива. А `sorted()` у множества вернёт обычный массив по алфавиту.

## @hint2
Склеить вложенные списки и выстроить цепочку можно так:

```swift
let allParcels = orders.flatMap { $0.parcels }

let nextStops = deliveries
    .filter { $0.isPaid }
    .sorted { $0.minutes < $1.minutes }
    .prefix(2)
    .map { $0.address }
```

Повторы убираются множеством: `Set(массив)`. У множества есть `sorted()`, который возвращает массив.

## @hint3
Заполни пропуски:

```swift
func allProducts(_ sellers: [Seller]) -> [Product] {
    return sellers.flatMap { ___ }
}

func weeklyPicks(_ sellers: [Seller], limit: Int) -> [String] {
    return allProducts(sellers)
        .filter { $0.inStock }
        .sorted { ___ }
        .prefix(___)
        .map { $0.name }
}

func categoryMenu(_ sellers: [Seller]) -> [String] {
    let categories = allProducts(sellers).map { $0.category }
    return ___(categories).sorted()
}
```

В первом пропуске — массив товаров продавца `$0`. Во втором — сравнение рейтингов, чтобы высокий шёл первым. В третьем — сколько товаров взять. В четвёртом — тип коллекции, в которой нет повторов.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает `allProducts`.** Замыкание возвращает массив `products` каждого продавца. `flatMap` выкладывает содержимое этих массивов подряд в один общий. С `map` получился бы массив массивов `[[Product]]`, и Swift сообщил бы, что тип не совпадает с `[Product]`. Продавец без товаров отдаёт пустой массив, и в результат от него ничего не попадает.

**Как работает `weeklyPicks`.** Каждый шаг цепочки получает результат предыдущего. `filter` оставляет товары в наличии. `sorted` ставит их по убыванию рейтинга. `prefix(limit)` берёт первые `limit` штук, а если товаров меньше — все. `map` превращает товары в названия. `prefix` возвращает срез, но после `map` получается обычный массив `[String]`, поэтому оборачивать в `Array` не нужно.

**Почему порядок шагов именно такой.** Если поставить `prefix` раньше `filter`, в подборку попадут первые товары каталога, а не лучшие, и часть из них отсеется. Если отсортировать до фильтра, результат будет верным, но сортировать придётся лишние товары. Фильтр первым — и правильно, и экономно.

**Как работает `categoryMenu`.** `map` даёт массив категорий с повторами: `["Дом", "Дом", "Дом", "Еда", ...]`. `Set(categories)` оставляет каждую категорию один раз, но у множества нет порядка. `sorted()` возвращает массив по алфавиту — и меню всегда выглядит одинаково.

**Типичные ошибки:**

- `prefix` раньше `filter` или `sorted` — в подборку попадают не лучшие товары;
- `$0.rating < $1.rating` — тогда первыми окажутся товары с самым низким рейтингом;
- в `categoryMenu` забыт `sorted()` — множество возвращает категории в случайном порядке;
- `map { $0.products }` вместо `flatMap` — получается массив массивов.
