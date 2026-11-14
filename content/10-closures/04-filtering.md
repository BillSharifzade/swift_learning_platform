---
title: Фильтры
concept: filter, first(where:), contains(where:), allSatisfy
---

## @description

### Контекст
В каталоге «Ярмарки» тысячи товаров, и без фильтров в нём не разобраться. Менеджер продукта принесла список того, что нужно экрану:

- переключатель «Только в наличии»;
- ползунок «Цена до...»;
- первый товар категории — для обложки раздела;
- значок «Здесь есть хиты», если в списке есть товар с очень высоким рейтингом;
- проверка корзины: все ли товары ещё в наличии.

Тимлид смотрит на список и говорит: «Это пять функций по одной строке. Циклы не понадобятся — у массива для всего этого есть готовые методы».

### Новое в Swift
Раньше, чтобы отобрать элементы массива, ты писала цикл: заводила пустой массив, проверяла каждый элемент через `if` и добавляла подходящие. Это работает, но Swift умеет делать такое сам. Тебе остаётся сообщить только условие — в виде замыкания.

Замыкание, которое получает один элемент и отвечает `true` или `false`, называют **предикатом**. Это просто вопрос к элементу: «ты подходишь?»

Для примеров возьмём отзывы о магазине:

```swift
struct Review {
    let author: String
    let stars: Int
    let hasPhoto: Bool
}

let reviews = [
    Review(author: "Билол", stars: 5, hasPhoto: true),
    Review(author: "tea_time", stars: 3, hasPhoto: false),
    Review(author: "cozy_home", stars: 4, hasPhoto: true)
]
```

**`filter` — оставить подходящие.** Возвращает новый массив из тех элементов, для которых замыкание ответило `true`. Порядок сохраняется:

```swift
let good = reviews.filter { $0.stars >= 4 }
// отзывы Билола и cozy_home
```

Здесь `$0` — очередной отзыв. Если не подошёл ни один, получится пустой массив.

**`first(where:)` — найти первый подходящий.** Возвращает один элемент, а не массив. Подходящего может не быть, поэтому результат — опционал:

```swift
let complaint = reviews.first(where: { $0.stars < 4 })
// Review? — внутри отзыв tea_time

let terrible = reviews.first(where: { $0.stars == 1 })
// nil
```

**`contains(where:)` — есть ли хотя бы один.** Возвращает `Bool`:

```swift
let hasPhotos = reviews.contains(where: { $0.hasPhoto })
// true
```

**`allSatisfy` — все ли подходят.** Тоже возвращает `Bool`:

```swift
let allPositive = reviews.allSatisfy { $0.stars >= 4 }
// false — отзыв tea_time не подходит
```

> 💡 Для пустого массива `allSatisfy` возвращает `true`: ни один элемент условие не нарушил. А `contains(where:)` для пустого массива возвращает `false`: подходящих нет.

Какой метод выбрать, подсказывает вопрос. «Какие?» — `filter`. «Какой первый?» — `first(where:)`. «Есть ли?» — `contains(where:)`. «Все ли?» — `allSatisfy`.

### Задача
В редакторе есть структура `Product` и заготовки пяти функций. Допиши тело каждой. Циклы не используй — в каждой функции достаточно одного метода с замыканием.

1. `inStockOnly(_:)` — возвращает только товары, которые есть в наличии (`inStock` равно `true`).
2. `affordable(_:maxPrice:)` — возвращает товары с ценой не выше `maxPrice`. Товар с ценой ровно `maxPrice` подходит.
3. `firstProduct(_:category:)` — возвращает первый товар из категории `category` или `nil`, если таких нет.
4. `hasBestseller(_:)` — возвращает `true`, если в списке есть хотя бы один товар с рейтингом `4.8` или выше.
5. `allInStock(_:)` — возвращает `true`, если все товары списка есть в наличии.

### Пример
```swift
let products = [
    Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9),
    Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: false, rating: 4.6),
    Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)
]

inStockOnly(products)                    // Плед вязаный, Мёд липовый
affordable(products, maxPrice: 780)      // Свеча соевая, Мёд липовый
firstProduct(products, category: "Дом")  // Плед вязаный
firstProduct(products, category: "Сад")  // nil
hasBestseller(products)                  // true
allInStock(products)                     // false
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

// 1. Только товары в наличии
func inStockOnly(_ products: [Product]) -> [Product] {

}

// 2. Товары с ценой не выше maxPrice
func affordable(_ products: [Product], maxPrice: Int) -> [Product] {

}

// 3. Первый товар из категории (или nil, если таких нет)
func firstProduct(_ products: [Product], category: String) -> Product? {

}

// 4. Есть ли хотя бы один товар с рейтингом 4.8 или выше
func hasBestseller(_ products: [Product]) -> Bool {

}

// 5. Все ли товары есть в наличии
func allInStock(_ products: [Product]) -> Bool {

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

// 1. Только товары в наличии
func inStockOnly(_ products: [Product]) -> [Product] {
    return products.filter { $0.inStock }
}

// 2. Товары с ценой не выше maxPrice
func affordable(_ products: [Product], maxPrice: Int) -> [Product] {
    return products.filter { $0.price <= maxPrice }
}

// 3. Первый товар из категории (или nil, если таких нет)
func firstProduct(_ products: [Product], category: String) -> Product? {
    return products.first(where: { $0.category == category })
}

// 4. Есть ли хотя бы один товар с рейтингом 4.8 или выше
func hasBestseller(_ products: [Product]) -> Bool {
    return products.contains(where: { $0.rating >= 4.8 })
}

// 5. Все ли товары есть в наличии
func allInStock(_ products: [Product]) -> Bool {
    return products.allSatisfy { $0.inStock }
}
```

## @tests
```swift
let __t_blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let __t_candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: false, rating: 4.6)
let __t_honey = Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)
let __t_earrings = Product(name: "Серьги из бисера", price: 1500, category: "Украшения", inStock: true, rating: 4.7)
let __t_jam = Product(name: "Варенье малиновое", price: 450, category: "Еда", inStock: false, rating: 4.8)
let __t_all = [__t_blanket, __t_candle, __t_honey, __t_earrings, __t_jam]
func __t_names(_ list: [Product]) -> [String] { list.map { $0.name } }

__eq("inStockOnly: из пяти товаров в наличии три", __t_names(inStockOnly(__t_all)), ["Плед вязаный", "Мёд липовый", "Серьги из бисера"], hint: "Оставь только товары, у которых inStock равно true, и не меняй их порядок")
__eq("inStockOnly: если ничего нет в наличии, список пуст", __t_names(inStockOnly([__t_candle, __t_jam])), [])
__eq("inStockOnly: пустой список остаётся пустым", __t_names(inStockOnly([])), [])

__eq("affordable: до 780 руб. подходят три товара", __t_names(affordable(__t_all, maxPrice: 780)), ["Свеча соевая", "Мёд липовый", "Варенье малиновое"], hint: "Товар с ценой ровно maxPrice тоже подходит: нужно сравнение <=, а не <")
__eq("affordable: до 450 руб. подходит только варенье", __t_names(affordable(__t_all, maxPrice: 450)), ["Варенье малиновое"], hint: "Товар с ценой ровно maxPrice тоже подходит: нужно сравнение <=, а не <")
__eq("affordable: до 449 руб. не подходит ничего", __t_names(affordable(__t_all, maxPrice: 449)), [])
__eq("affordable: до 5000 руб. подходят все", affordable(__t_all, maxPrice: 5000).count, 5)

__eq("firstProduct: первый товар категории «Еда» — мёд", firstProduct(__t_all, category: "Еда")?.name, "Мёд липовый", hint: "Нужен первый по порядку товар, у которого category совпадает с переданной")
__eq("firstProduct: первый товар категории «Дом» — плед", firstProduct(__t_all, category: "Дом")?.name, "Плед вязаный")
__eq("firstProduct: в категории «Украшения» один товар", firstProduct(__t_all, category: "Украшения")?.name, "Серьги из бисера")
__eq("firstProduct: категории «Игрушки» нет — nil", firstProduct(__t_all, category: "Игрушки")?.name, nil)
__eq("firstProduct: в пустом списке — nil", firstProduct([], category: "Дом")?.name, nil)

__eq("hasBestseller: в полном списке есть хит", hasBestseller(__t_all), true)
__eq("hasBestseller: рейтинг ровно 4.8 — уже хит", hasBestseller([__t_honey, __t_jam]), true, hint: "Рейтинг ровно 4.8 подходит: нужно сравнение >=, а не >")
__eq("hasBestseller: рейтинги 4.6, 4.4 и 4.7 — хитов нет", hasBestseller([__t_candle, __t_honey, __t_earrings]), false)
__eq("hasBestseller: в пустом списке хитов нет", hasBestseller([]), false)

__eq("allInStock: плед, мёд и серьги — всё в наличии", allInStock([__t_blanket, __t_honey, __t_earrings]), true)
__eq("allInStock: в полном списке есть отсутствующие товары", allInStock(__t_all), false)
__eq("allInStock: одного отсутствующего товара достаточно для false", allInStock([__t_blanket, __t_honey, __t_jam]), false)
__eq("allInStock: для пустого списка — true", allInStock([]), true, hint: "В пустом списке нет ни одного товара, которого не было бы в наличии. allSatisfy в этом случае возвращает true")
```

## @rules
- mustnot: /\b(for|while|repeat)\b/ :: Циклы в этой задаче не нужны: у массива есть готовые методы `filter`, `first(where:)`, `contains(where:)` и `allSatisfy`.
- mustnot: /\.forEach\b/ :: Обойдись без перебора элементов: у массива есть готовые методы `filter`, `first(where:)`, `contains(where:)` и `allSatisfy`.
- must: /\.filter\s*[{(]/ :: Чтобы отобрать подходящие товары, используй метод `filter`.
- must: /\.first\s*(\(\s*where\s*:|\{)/ :: Чтобы найти первый подходящий товар, используй `first(where:)`.
- must: /\.contains\s*(\(\s*where\s*:|\{)/ :: Чтобы узнать, есть ли хотя бы один подходящий товар, используй `contains(where:)`.
- must: /\.allSatisfy\s*[{(]/ :: Чтобы узнать, все ли товары подходят, используй `allSatisfy`.

## @hint1
Каждая функция — это одна строка: `return`, массив `products`, точка, нужный метод и замыкание с условием. Внутри замыкания `$0` — это очередной товар, а его свойства доступны через точку.

Сначала для каждой функции выбери метод. Задай себе вопрос, на который она отвечает. «Какие товары в наличии?» и «какие товары не дороже?» — нужен список, значит, `filter`. «Какой первый товар категории?» — нужен один элемент, значит, `first(where:)`. «Есть ли хит?» — значит, `contains(where:)`. «Все ли в наличии?» — значит, `allSatisfy`.

Теперь условия. Для наличия условие — само свойство `inStock`: оно уже имеет тип `Bool`, сравнивать его с `true` не нужно. Для цены — цена товара меньше либо равна `maxPrice`. Для категории — категория товара равна параметру `category`. Для хита — рейтинг больше либо равен 4.8.

Обрати внимание на границы: «не выше» и «или выше» означают, что равенство тоже подходит.

## @hint2
Вот как эти методы выглядят на отзывах:

```swift
let good = reviews.filter { $0.stars >= 4 }                    // [Review]
let complaint = reviews.first(where: { $0.stars < 4 })         // Review?
let hasPhotos = reviews.contains(where: { $0.hasPhoto })       // Bool
let allPositive = reviews.allSatisfy { $0.stars >= 4 }         // Bool
```

Тип результата каждого метода совпадает с тем, что должна вернуть твоя функция. Например, `firstProduct` возвращает `Product?` — и `first(where:)` тоже возвращает опционал, разворачивать его не нужно.

Внутри замыкания можно пользоваться параметрами функции:

```swift
return products.filter { $0.price <= maxPrice }
```

## @hint3
Первые две функции готовы. В остальных заполни пропуски:

```swift
func inStockOnly(_ products: [Product]) -> [Product] {
    return products.filter { $0.inStock }
}

func affordable(_ products: [Product], maxPrice: Int) -> [Product] {
    return products.filter { $0.price <= maxPrice }
}

func firstProduct(_ products: [Product], category: String) -> Product? {
    return products.first(where: { $0.category == ___ })
}

func hasBestseller(_ products: [Product]) -> Bool {
    return products.contains(where: { $0.rating ___ 4.8 })
}

func allInStock(_ products: [Product]) -> Bool {
    return products.___ { $0.inStock }
}
```

В первом пропуске — с чем сравнивается категория товара. Во втором — знак сравнения, при котором рейтинг ровно 4.8 тоже подходит. В третьем — имя метода, который отвечает на вопрос «все ли подходят?».

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Все пять методов устроены одинаково: они сами перебирают массив и для каждого элемента вызывают твоё замыкание. Элемент попадает в `$0`, замыкание отвечает `true` или `false`. Разница только в том, что метод делает с ответами. `filter` собирает все элементы с ответом `true` в новый массив. `first(where:)` останавливается на первом `true` и возвращает этот элемент. `contains(where:)` тоже останавливается на первом `true`, но возвращает просто `true`. `allSatisfy` останавливается на первом `false`.

**Почему `{ $0.inStock }` без сравнения.** Свойство `inStock` уже имеет тип `Bool`. Запись `$0.inStock == true` даёт тот же результат, но длиннее.

**Почему замыкание видит `maxPrice` и `category`.** Замыкание написано внутри функции и может пользоваться всем, что есть вокруг него, в том числе параметрами функции. Об этой способности будет отдельная задача.

**Почему `firstProduct` возвращает опционал.** Товара нужной категории может не оказаться. `first(where:)` честно сообщает об этом через `nil`, и функция передаёт этот ответ дальше. Тот, кто её вызывает, сам решит, что показать вместо обложки.

**Чем это лучше цикла.** Цикл с `if` и `append` занял бы пять строк на каждую функцию, и в каждой можно ошибиться. Здесь же в коде осталось только условие, а название метода сразу говорит, что происходит.

**Типичные ошибки:**

- `<` вместо `<=` и `>` вместо `>=` — тогда товар ровно на границе не попадёт в результат;
- `filter` там, где нужен один элемент: `filter` всегда возвращает массив, а не `Product?`;
- `contains` вместо `allSatisfy` в последней функции — он ответит `true`, даже если в наличии только один товар из десяти;
- одинарное `=` вместо `==` при сравнении категорий.
