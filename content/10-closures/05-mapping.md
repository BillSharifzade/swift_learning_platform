---
title: Преобразование списка
concept: map и compactMap
---

## @description

### Контекст
В «Ярмарку» пришли сразу три тикета, и все про одно и то же: из одного списка нужно получить другой.

- Дизайнер: «Под каждой карточкой каталога нужна подпись с ценой. Если товара нет в наличии, вместо цены пишем, что его нет».
- Продавцы загружают цены из своих таблиц. В ячейках бывает что угодно: `договорная`, пустая строка, `1 200` с пробелом. Такие ячейки нужно пропускать, а не ронять загрузку.
- Корзина хранит только артикулы товаров. Чтобы показать её на экране, по артикулам нужно найти сами товары в каталоге. Если товар сняли с продажи, его артикула в каталоге уже нет — такой товар просто не показываем.

### Новое в Swift
**`map` — превратить каждый элемент.** Метод `map` проходит по массиву, отдаёт каждый элемент в замыкание и собирает всё, что замыкание вернуло, в новый массив. Элементов в новом массиве столько же, сколько в старом, и порядок тот же.

Для примеров возьмём пункты выдачи заказов:

```swift
struct PickupPoint {
    let address: String
    let opensAt: Int
    let closesAt: Int
}

let points = [
    PickupPoint(address: "ул. Садовая, 12", opensAt: 9, closesAt: 21),
    PickupPoint(address: "пр. Мира, 40", opensAt: 10, closesAt: 23)
]

let schedule = points.map { "\($0.address): с \($0.opensAt) до \($0.closesAt)" }
// ["ул. Садовая, 12: с 9 до 21", "пр. Мира, 40: с 10 до 23"]
```

Тип результата зависит от того, что возвращает замыкание. Здесь оно возвращает строку, поэтому из `[PickupPoint]` получился `[String]`. А так получится `[Int]`:

```swift
let hours = points.map { $0.closesAt - $0.opensAt }   // [12, 13]
```

Если в замыкании несколько строк, дай параметру имя и пиши `return`, как в обычной функции:

```swift
let labels = points.map { point in
    if point.closesAt >= 23 {
        return "\(point.address) (допоздна)"
    }
    return point.address
}
// ["ул. Садовая, 12", "пр. Мира, 40 (допоздна)"]
```

**`compactMap` — превратить и выбросить пустое.** Бывает, что превращение может не получиться. Тогда замыкание возвращает опционал, и `map` честно собирает массив опционалов:

```swift
let typed = ["2", "1", "много", "3"]   // что ввели в поле «Количество»

let parsed = typed.map { Int($0) }
// [Optional(2), Optional(1), nil, Optional(3)] — тип [Int?]
```

С таким массивом неудобно работать: каждый элемент пришлось бы разворачивать. `compactMap` делает два дела сразу: выбрасывает все `nil` и разворачивает остальное:

```swift
let quantities = typed.compactMap { Int($0) }
// [2, 1, 3] — тип [Int]
```

Второй частый источник `nil` — чтение из словаря по ключу:

```swift
let deliveryDays = ["Москва": 1, "Казань": 3, "Сочи": 4]
let cities = ["Казань", "Норильск", "Москва"]

let days = cities.compactMap { deliveryDays[$0] }
// [3, 1] — в Норильск доставки нет, он пропущен
```

> 💡 Как выбрать: если превращение получается всегда — `map`. Если может вернуть `nil`, а пустые результаты не нужны — `compactMap`.

### Задача
В редакторе есть структура `Product` и заготовки трёх функций. Допиши их тела. Циклы не используй.

1. `priceLabels(_:)` — получает массив товаров и возвращает массив подписей `[String]`, по одной на каждый товар, в том же порядке. Если товар в наличии, подпись такая: `Плед вязаный: 2400 руб.` (название, двоеточие, пробел, цена, пробел, `руб.`). Если товара нет в наличии: `Свеча соевая: нет в наличии`. Используй `map`.
2. `parsePrices(_:)` — получает массив строк из таблицы продавца и возвращает массив `[Int]` только из тех строк, которые превращаются в целое число через `Int(...)`. Остальные строки пропускаются. Порядок сохраняется. Используй `compactMap`.
3. `cartProducts(_:catalog:)` — получает массив артикулов из корзины и каталог: словарь `[String: Product]`, где ключ — артикул. Возвращает товары, найденные в каталоге, в порядке артикулов в корзине. Артикулы, которых нет в каталоге, пропускаются. Используй `compactMap`.

### Пример
```swift
let blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: false, rating: 4.6)

priceLabels([blanket, candle])
// ["Плед вязаный: 2400 руб.", "Свеча соевая: нет в наличии"]

parsePrices(["2400", "договорная", "650", "", "1 200"])
// [2400, 650]

let catalog = ["10021": blanket, "10035": candle]
cartProducts(["10035", "10077", "10021"], catalog: catalog)
// свеча и плед — артикула 10077 в каталоге нет
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

// 1. Подписи под карточками каталога: цена или "нет в наличии"
func priceLabels(_ products: [Product]) -> [String] {

}

// 2. Цены из таблицы продавца: ячейки, которые не число, пропускаются
func parsePrices(_ rawPrices: [String]) -> [Int] {

}

// 3. Товары корзины по артикулам: снятые с продажи пропускаются
func cartProducts(_ articles: [String], catalog: [String: Product]) -> [Product] {

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

// 1. Подписи под карточками каталога: цена или "нет в наличии"
func priceLabels(_ products: [Product]) -> [String] {
    return products.map { product in
        if product.inStock {
            return "\(product.name): \(product.price) руб."
        }
        return "\(product.name): нет в наличии"
    }
}

// 2. Цены из таблицы продавца: ячейки, которые не число, пропускаются
func parsePrices(_ rawPrices: [String]) -> [Int] {
    return rawPrices.compactMap { Int($0) }
}

// 3. Товары корзины по артикулам: снятые с продажи пропускаются
func cartProducts(_ articles: [String], catalog: [String: Product]) -> [Product] {
    return articles.compactMap { catalog[$0] }
}
```

## @tests
```swift
let __t_blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let __t_candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: false, rating: 4.6)
let __t_honey = Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)
let __t_earrings = Product(name: "Серьги из бисера", price: 1500, category: "Украшения", inStock: true, rating: 4.7)
let __t_jam = Product(name: "Варенье малиновое", price: 450, category: "Еда", inStock: false, rating: 4.8)
func __t_names(_ list: [Product]) -> [String] { list.map { $0.name } }

__eq("priceLabels: товары в наличии и без", priceLabels([__t_blanket, __t_candle, __t_honey]),
     ["Плед вязаный: 2400 руб.", "Свеча соевая: нет в наличии", "Мёд липовый: 780 руб."],
     hint: "Для товара в наличии: название, двоеточие, пробел, цена и руб. с точкой. Для отсутствующего: название, двоеточие, пробел и нет в наличии")
__eq("priceLabels: другой набор товаров", priceLabels([__t_jam, __t_earrings]),
     ["Варенье малиновое: нет в наличии", "Серьги из бисера: 1500 руб."])
__eq("priceLabels: подписей столько же, сколько товаров", priceLabels([__t_candle, __t_jam]).count, 2,
     hint: "map возвращает по одному значению на каждый элемент. Товары не в наличии тоже получают подпись")
__eq("priceLabels: пустой каталог — нет подписей", priceLabels([]), [])

__eq("parsePrices: все ячейки — числа", parsePrices(["2400", "650", "890"]), [2400, 650, 890])
__eq("parsePrices: текст, пустая ячейка и число с пробелом пропускаются",
     parsePrices(["2400", "договорная", "650", "", "1 200", "890"]), [2400, 650, 890],
     hint: "Ячейки, которые не превращаются в число, нужно пропустить, а не заменять нулём. Int(...) возвращает для них nil, а compactMap выбрасывает nil")
__eq("parsePrices: цена 0 руб. — тоже число", parsePrices(["0", "150"]), [0, 150])
__eq("parsePrices: ни одного числа", parsePrices(["уточнить", "-"]), [])
__eq("parsePrices: пустая таблица", parsePrices([]), [])

let __t_catalog = ["10021": __t_blanket, "10035": __t_candle, "10048": __t_honey, "10052": __t_earrings]
__eq("cartProducts: все артикулы есть в каталоге", __t_names(cartProducts(["10048", "10021"], catalog: __t_catalog)),
     ["Мёд липовый", "Плед вязаный"],
     hint: "Найди каждый артикул в словаре catalog и сохрани порядок корзины")
__eq("cartProducts: снятый с продажи товар пропускается", __t_names(cartProducts(["10035", "10077", "10021"], catalog: __t_catalog)),
     ["Свеча соевая", "Плед вязаный"],
     hint: "Артикула 10077 в каталоге нет: catalog[...] вернёт nil, и compactMap его выбросит")
__eq("cartProducts: два одинаковых артикула — два товара", __t_names(cartProducts(["10052", "10052"], catalog: __t_catalog)),
     ["Серьги из бисера", "Серьги из бисера"])
__eq("cartProducts: ни одного товара в каталоге", __t_names(cartProducts(["99999"], catalog: __t_catalog)), [])
__eq("cartProducts: пустая корзина", __t_names(cartProducts([], catalog: __t_catalog)), [])
__eq("cartProducts: пустой каталог", __t_names(cartProducts(["10021"], catalog: [:])), [])
```

## @rules
- mustnot: /\b(for|while|repeat)\b/ :: Циклы в этой задаче не нужны: `map` и `compactMap` сами перебирают элементы.
- mustnot: /\.forEach\b/ :: Обойдись без перебора элементов: новый массив соберут `map` и `compactMap`.
- must: /\.map\s*[{(]/ :: Подписи под карточками собери методом `map`.
- must: /\.compactMap\s*[{(][\s\S]*\.compactMap\s*[{(]/ :: В `parsePrices` и в `cartProducts` используй `compactMap`: он сам выбросит значения `nil`.

## @hint1
Все три функции — это `return` и один вызов метода у массива-параметра.

В `priceLabels` каждый товар превращается в строку, и превращение получается всегда. Значит, нужен `map`. В замыкании две ветки, поэтому дай параметру понятное имя, например `product`, и напиши внутри `if` по свойству `inStock`. В одной ветке верни строку с ценой, в другой — строку про отсутствие. Обе строки собираются интерполяцией.

В `parsePrices` каждую строку нужно попробовать превратить в число через `Int(...)`. Это может не получиться, и тогда будет `nil`. Такие значения нужно выбросить — это работа `compactMap`.

В `cartProducts` каждый артикул нужно найти в словаре `catalog`. Чтение из словаря по ключу тоже даёт опционал: такого артикула может не быть. Снова `compactMap`, только перебирать нужно массив артикулов.

## @hint2
Многострочное замыкание в `map` выглядит так:

```swift
let labels = points.map { point in
    if point.closesAt >= 23 {
        return "\(point.address) (допоздна)"
    }
    return point.address
}
```

А так `compactMap` пропускает то, что не превратилось в число, и то, чего нет в словаре:

```swift
let quantities = typed.compactMap { Int($0) }
let days = cities.compactMap { deliveryDays[$0] }
```

## @hint3
Заполни пропуски:

```swift
func priceLabels(_ products: [Product]) -> [String] {
    return products.map { product in
        if product.___ {
            return "\(product.name): \(product.price) руб."
        }
        return "\(product.name): нет в наличии"
    }
}

func parsePrices(_ rawPrices: [String]) -> [Int] {
    return rawPrices.compactMap { ___ }
}

func cartProducts(_ articles: [String], catalog: [String: Product]) -> [Product] {
    return articles.___ { catalog[$0] }
}
```

В первом пропуске — свойство товара, которое говорит, есть ли он в наличии. Во втором — попытка превратить строку `$0` в целое число. В третьем — метод, который выбрасывает `nil`.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает `priceLabels`.** `map` по очереди отдаёт каждый товар в замыкание. Параметр назван `product`, а не `$0`, потому что в теле несколько строк и с именем их легче читать. Замыкание возвращает строку, поэтому из `[Product]` получается `[String]`. Подписей ровно столько, сколько товаров: `map` никогда не пропускает элементы.

**Как работает `parsePrices`.** `Int($0)` пробует прочитать число из строки. Из `"2400"` получится `2400`, а из `"договорная"`, пустой строки и `"1 200"` с пробелом — `nil`. Обычный `map` вернул бы `[Int?]`, и тип не совпал бы с `[Int]`. `compactMap` выбрасывает каждый `nil` и разворачивает остальные значения, поэтому результат сразу имеет тип `[Int]`.

**Как работает `cartProducts`.** `catalog[$0]` ищет товар по артикулу и возвращает `Product?`. Для снятого с продажи товара это `nil`, и `compactMap` его пропускает. Перебирается массив `articles`, а не словарь, поэтому порядок товаров совпадает с порядком в корзине. У словаря порядка нет.

**Почему без циклов.** Тот же результат дал бы цикл: пустой массив, `if let` и `append`. Но это пять строк на функцию, и в каждой можно ошибиться. Здесь осталось только главное: во что превратить элемент.

**Типичные ошибки:**

- `rawPrices.map { Int($0) ?? 0 }` — испорченные ячейки превращаются в цену 0 руб., и в каталоге появляются бесплатные товары. Их нужно пропустить, а не заменить;
- `map` вместо `compactMap` — Swift сообщит, что опционал `Int?` нужно развернуть: `map` собирает `[Int?]`, а функция обещала `[Int]`;
- в `priceLabels` пропущен пробел перед `руб.` или точка после него — подпись не совпадёт с макетом;
- в `cartProducts` перебирается `catalog`, а не `articles` — тогда в корзину попадёт весь каталог.
