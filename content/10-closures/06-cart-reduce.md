---
title: Итог корзины
concept: reduce и reduce(into:)
---

## @description

### Контекст
Экран корзины почти готов: строки с товарами, кнопки «плюс» и «минус». Не хватает трёх чисел, и все три — про то, как из целого списка получить один результат.

- Внизу экрана — строка «Итого». Это сумма по всем строкам корзины: цена товара, умноженная на количество.
- На иконке корзины в шапке — маленький значок с числом. Это сколько всего штук товаров лежит в корзине, а не сколько в ней строк.
- Склад просит лист сборки: сколько штук нужно взять из каждой категории.

Тимлид напоминает: «Для сворачивания списка в одно значение у массива есть `reduce`. Циклы не пиши».

### Новое в Swift
**`reduce` — свернуть массив в одно значение.** Ты уже считала сумму циклом: заводила переменную с нулём и в цикле прибавляла к ней каждый элемент. `reduce` делает то же самое, а от тебя ждёт только две вещи:

- начальное значение — с чего начинается подсчёт;
- замыкание — как из результата «на данный момент» и очередного элемента получить новый результат.

Посчитаем общий вес посылок у курьера, в граммах:

```swift
let parcelWeights = [1200, 800, 450]

let totalWeight = parcelWeights.reduce(0, { (sum: Int, weight: Int) -> Int in
    return sum + weight
})
// 2450
```

Что происходит по шагам:

1. Начальное значение `0` становится первым `sum`.
2. Замыкание получает `sum = 0` и `weight = 1200`, возвращает `1200`.
3. Это значение становится новым `sum`: замыкание получает `1200` и `800`, возвращает `2000`.
4. Потом `2000` и `450` — получается `2450`. Элементы кончились, это и есть результат.

Короткая запись такая же, как у других методов. Замыкание стоит в хвосте, `$0` — результат на данный момент, `$1` — очередной элемент:

```swift
let totalWeight = parcelWeights.reduce(0) { $0 + $1 }
```

Если элементы — структуры, свойство берётся через точку:

```swift
struct Parcel {
    let tracking: String
    let weight: Int
}

let parcels = [Parcel(tracking: "RU-501", weight: 1200), Parcel(tracking: "RU-502", weight: 800)]
let weight = parcels.reduce(0) { $0 + $1.weight }   // 2000
```

Для пустого массива замыкание не вызывается ни разу, и `reduce` возвращает начальное значение.

**`reduce(into:)` — собрать результат на месте.** Иногда результат — не число, а словарь или массив. Обычный `reduce` на каждом шаге создавал бы новый словарь. Для таких случаев есть `reduce(into:)`. В нём `$0` — сам результат, и его можно **менять прямо в замыкании**, как `inout`-параметр. Возвращать ничего не нужно.

Посчитаем, сколько отзывов получил магазин с каждой оценкой:

```swift
let stars = [5, 4, 5, 3, 5]

let starCounts = stars.reduce(into: [:]) { $0[$1, default: 0] += 1 }
// [5: 3, 4: 1, 3: 1] — тип [Int: Int]
```

Начальное значение `[:]` — пустой словарь. Для каждой оценки `$1` значение по ключу увеличивается на один. Запись с `default:` тебе знакома: если ключа ещё нет, счёт начинается с нуля. Тип словаря Swift понял из того, как он используется.

> 💡 Как выбрать: результат — число или строка, и новое значение легко посчитать из старого — `reduce`. Результат — словарь или массив, который удобнее дополнять, — `reduce(into:)`.

### Задача
В редакторе есть структуры `Product` и `CartItem` (строка корзины: товар и количество) и заготовки трёх функций. Допиши их тела. Циклы не используй.

1. `cartTotal(_:)` — возвращает итог корзины: сумму `price * quantity` по всем строкам. Для пустой корзины — `0`. Используй `reduce`.
2. `itemsCount(_:)` — возвращает, сколько всего штук товаров в корзине: сумму `quantity` по всем строкам. Для пустой корзины — `0`. Используй `reduce`.
3. `quantityByCategory(_:)` — возвращает словарь `[String: Int]`: ключ — категория товара, значение — сколько штук этой категории в корзине. Для пустой корзины — пустой словарь. Используй `reduce(into:)`.

### Пример
```swift
let blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: true, rating: 4.6)
let honey = Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)

let cart = [
    CartItem(product: blanket, quantity: 1),
    CartItem(product: candle, quantity: 3),
    CartItem(product: honey, quantity: 2)
]

cartTotal(cart)           // 5910 = 2400 + 650 * 3 + 780 * 2
itemsCount(cart)          // 6
quantityByCategory(cart)  // ["Дом": 4, "Еда": 2]
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

// Строка корзины: какой товар и сколько штук
struct CartItem {
    let product: Product
    let quantity: Int
}

// 1. Итог корзины: сумма цен с учётом количества
func cartTotal(_ items: [CartItem]) -> Int {

}

// 2. Сколько всего штук в корзине (число на значке корзины)
func itemsCount(_ items: [CartItem]) -> Int {

}

// 3. Лист сборки для склада: сколько штук из каждой категории
func quantityByCategory(_ items: [CartItem]) -> [String: Int] {

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

// Строка корзины: какой товар и сколько штук
struct CartItem {
    let product: Product
    let quantity: Int
}

// 1. Итог корзины: сумма цен с учётом количества
func cartTotal(_ items: [CartItem]) -> Int {
    return items.reduce(0) { $0 + $1.product.price * $1.quantity }
}

// 2. Сколько всего штук в корзине (число на значке корзины)
func itemsCount(_ items: [CartItem]) -> Int {
    return items.reduce(0) { $0 + $1.quantity }
}

// 3. Лист сборки для склада: сколько штук из каждой категории
func quantityByCategory(_ items: [CartItem]) -> [String: Int] {
    return items.reduce(into: [:]) { $0[$1.product.category, default: 0] += $1.quantity }
}
```

## @tests
```swift
let __t_blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let __t_candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: true, rating: 4.6)
let __t_honey = Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)
let __t_earrings = Product(name: "Серьги из бисера", price: 1500, category: "Украшения", inStock: true, rating: 4.7)

let __t_cart = [
    CartItem(product: __t_blanket, quantity: 1),
    CartItem(product: __t_candle, quantity: 3),
    CartItem(product: __t_honey, quantity: 2),
    CartItem(product: __t_earrings, quantity: 1)
]
let __t_candles = [CartItem(product: __t_candle, quantity: 2)]
let __t_single = [CartItem(product: __t_earrings, quantity: 1)]

__eq("cartTotal: четыре строки, 7410 руб.", cartTotal(__t_cart), 7410,
     hint: "Для каждой строки умножь цену товара на количество: $1.product.price * $1.quantity")
__eq("cartTotal: две свечи по 650 руб.", cartTotal(__t_candles), 1300,
     hint: "Цена товара умножается на количество штук в строке")
__eq("cartTotal: одна пара серёг", cartTotal(__t_single), 1500)
__eq("cartTotal: пустая корзина — 0 руб.", cartTotal([]), 0,
     hint: "Для пустого массива reduce возвращает начальное значение — оно должно быть 0")

__eq("itemsCount: четыре строки, семь штук", itemsCount(__t_cart), 7,
     hint: "Нужно число штук, а не строк корзины: сложи quantity всех строк")
__eq("itemsCount: две свечи в одной строке", itemsCount(__t_candles), 2,
     hint: "В одной строке может лежать несколько штук: сложи quantity")
__eq("itemsCount: пустая корзина — 0", itemsCount([]), 0)

__eq("quantityByCategory: три категории", quantityByCategory(__t_cart), ["Дом": 4, "Еда": 2, "Украшения": 1],
     hint: "Прибавляй к значению категории количество штук строки, а не единицу")
__eq("quantityByCategory: одна категория", quantityByCategory(__t_candles), ["Дом": 2])
__eq("quantityByCategory: пустая корзина — пустой словарь", quantityByCategory([]), [:])
```

## @rules
- mustnot: /\b(for|while|repeat)\b/ :: Циклы в этой задаче не нужны: `reduce` сам проходит по всем строкам корзины.
- mustnot: /\.forEach\b/ :: Обойдись без перебора элементов: результат соберёт `reduce`.
- must: /\.reduce\s*\((?!\s*into\s*:)/ :: Итог и число штук посчитай через `reduce` с начальным значением: `items.reduce(0) { ... }`.
- must: /\.reduce\s*\(\s*into\s*:/ :: Словарь для склада собери через `reduce(into:)`: `items.reduce(into: [:]) { ... }`.

## @hint1
Каждая функция — это `return` и один вызов `reduce` у массива `items`.

В первых двух функциях результат — число, и начинается подсчёт с нуля. Значит, начальное значение — `0`, а в замыкании к результату на данный момент (`$0`) прибавляется вклад очередной строки корзины (`$1`). В `cartTotal` вклад строки — цена её товара, умноженная на количество. Цена лежит внутри товара, поэтому до неё две точки: строка, товар, цена. В `itemsCount` вклад строки — просто её количество.

В третьей функции результат — словарь, поэтому нужен `reduce(into:)` с пустым словарём в начале. В замыкании `$0` — этот словарь, его можно менять прямо на месте. Для каждой строки увеличь значение по ключу её категории на количество штук. Чтобы для новой категории счёт начался с нуля, читай значение с `default:`.

## @hint2
Сумма по свойству структуры и подсчёт в словаре выглядят так:

```swift
let weight = parcels.reduce(0) { $0 + $1.weight }

let starCounts = stars.reduce(into: [:]) { $0[$1, default: 0] += 1 }
```

У тебя `$1` — строка корзины `CartItem`. Её количество — `$1.quantity`, а категория её товара — `$1.product.category`.

## @hint3
Заполни пропуски:

```swift
func cartTotal(_ items: [CartItem]) -> Int {
    return items.reduce(0) { $0 + $1.product.price * ___ }
}

func itemsCount(_ items: [CartItem]) -> Int {
    return items.reduce(___) { $0 + $1.quantity }
}

func quantityByCategory(_ items: [CartItem]) -> [String: Int] {
    return items.reduce(into: [:]) { $0[___, default: 0] += $1.quantity }
}
```

В первом пропуске — количество штук в строке. Во втором — начальное значение подсчёта. В третьем — категория товара из строки `$1`.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает `cartTotal`.** Начальное значение — `0`. Для каждой строки замыкание получает сумму на данный момент (`$0`) и саму строку (`$1`). Оно возвращает новую сумму: старую плюс цену товара, умноженную на количество. Для корзины из примера шаги такие: `0 + 2400 = 2400`, `2400 + 1950 = 4350`, `4350 + 1560 = 5910`.

**Почему в `itemsCount` не `items.count`.** `count` — это число строк корзины. Но в одной строке может лежать три свечи, и на значке покупатель ждёт увидеть все три. Поэтому складывается `quantity`.

**Как работает `quantityByCategory`.** `reduce(into: [:])` начинает с пустого словаря. Тип `[String: Int]` Swift берёт из того, что функция возвращает. Для каждой строки значение по ключу категории увеличивается на количество. Если категория встретилась впервые, `default: 0` даёт начальный ноль. Замыкание ничего не возвращает: оно меняет словарь `$0` на месте. Поэтому здесь и нужен вариант `into` — в обычном `reduce` пришлось бы на каждом шаге делать копию словаря и возвращать её.

**Пустая корзина.** Если строк нет, замыкание не вызывается ни разу, и `reduce` возвращает начальное значение: `0` или пустой словарь. Отдельная проверка на пустоту не нужна.

**Типичные ошибки:**

- `$0 + $1.product.price` без умножения на количество — три свечи посчитаются как одна;
- в словаре `+= 1` вместо `+= $1.quantity` — получится число строк в категории, а не штук;
- `$1.category` — у строки корзины нет категории, она есть у товара: `$1.product.category`;
- в `reduce(into:)` написан `return` — замыкание здесь ничего не возвращает, а меняет `$0`.
