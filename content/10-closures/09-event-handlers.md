---
title: Обработчики событий
concept: Итог модуля — @escaping, хранение замыканий, typealias, forEach
---

## @description

### Контекст
Финальная задача модуля. Когда покупатель нажимает «Оформить заказ», об этом должны узнать сразу несколько частей «Ярмарки»: письмо покупателю, менеджер крупных заказов, а скоро ещё склад и аналитика. Если кнопка будет сама вызывать каждую из них, её код разрастётся. А каждый новый участник будет означать правку кнопки.

Тимлид предлагает другую схему: «Сделаем центр событий. Кто хочет узнавать о заказах, подписывается и оставляет своё замыкание. Кнопка сообщает центру о заказе, а центр вызывает всех подписчиков по очереди. Это итоговая задача: пригодится всё, что было в модуле».

### Новое в Swift
**`@escaping` — замыкание, которое сохраняют на потом.** В задаче про загрузку каталога `loadCatalog` вызывала `completion` сразу, пока работала сама. Такое замыкание Swift считает **неубегающим**: после того как функция закончилась, оно больше не нужно.

Если функция хочет сохранить замыкание — в массив или в свойство — и вызвать его позже, оно «убегает» из функции. Это нужно объявить явно: перед типом параметра пишут `@escaping`. Вот покупатели просят сообщить, когда товар снова появится в продаже:

```swift
var restockActions: [(String) -> Void] = []

func onRestock(_ action: @escaping (String) -> Void) {
    restockActions.append(action)
}
```

Без `@escaping` Swift откажется компилировать `append`: он предупреждает, что замыкание переживёт функцию, а этого никто не обещал.

**`typealias` — короткое имя для типа.** Тип `(String) -> Void` теперь встречается в двух местах, а в настоящем проекте их были бы десятки. Ему можно дать имя:

```swift
typealias RestockAction = (String) -> Void

var restockActions: [RestockAction] = []

func onRestock(_ action: @escaping RestockAction) {
    restockActions.append(action)
}
```

Новый тип при этом не появляется. `RestockAction` — просто второе имя для `(String) -> Void`, зато код читается легче.

**`forEach` — сделать что-то с каждым элементом.** Подписки сохранены, а когда товар поступил, нужно вызвать их все:

```swift
onRestock { name in print("Push: \(name) снова в продаже") }
onRestock { name in print("Письмо: \(name) снова в продаже") }

restockActions.forEach { $0("Ваза глиняная") }
// Push: Ваза глиняная снова в продаже
// Письмо: Ваза глиняная снова в продаже
```

`forEach` вызывает замыкание для каждого элемента по порядку и ничего не возвращает — в отличие от `map`. Здесь каждый элемент `$0` сам является замыканием, поэтому `$0("Ваза глиняная")` — его вызов. Это то же самое, что `for action in restockActions { action("Ваза глиняная") }`.

**Замыкание-обёртка.** Иногда подписчику нужно не всё подряд. Тогда сохраняют не его замыкание, а новое — с проверкой внутри. Новое замыкание захватывает и условие, и исходное замыкание:

```swift
func onRestock(only wantedName: String, _ action: @escaping RestockAction) {
    let filtered: RestockAction = { name in
        if name == wantedName {
            action(name)
        }
    }
    restockActions.append(filtered)
}
```

> 💡 Если массив замыканий — свойство структуры, метод, который добавляет в него элементы, должен быть `mutating`. Это ты уже знаешь из модуля про структуры.

### Задача
В редакторе есть структуры `Product`, `CartItem`, заготовка `Order` и два готовых заказа.

1. В структуре `Order` объяви вычисляемое свойство `total` типа `Int` — сумма заказа: `price * quantity` по всем строкам `items`. Посчитай через `reduce`.
2. Объяви `typealias OrderHandler` для типа `(Order) -> Void`.
3. Напиши структуру `OrderEvents`:
   - свойство `handlers` типа `[OrderHandler]`, изначально пустой массив;
   - метод `mutating func subscribe(_ handler: @escaping OrderHandler)` — добавляет обработчик в конец `handlers`. Сразу его не вызывает;
   - метод `mutating func subscribe(minTotal: Int, _ handler: @escaping OrderHandler)` — тоже добавляет в `handlers` одно замыкание. Это замыкание вызывает `handler` только для заказов, у которых `total` не меньше `minTotal`;
   - метод `func notify(_ order: Order)` — вызывает все обработчики из `handlers` по порядку подписки и передаёт им заказ.
4. После заказов создай переменную `events` — пустой `OrderEvents()`. Подпиши два обработчика, оба замыкания передай в хвосте:
   - через `subscribe` — для всех заказов печатает `Письмо покупателю: заказ НОМЕР на СУММА руб. оформлен`;
   - через `subscribe(minTotal: 10000)` — печатает `Менеджеру: крупный заказ НОМЕР`.

   Затем вызови `events.notify(firstOrder)` и `events.notify(bigOrder)`.

### Пример
Вывод программы:

```text
Письмо покупателю: заказ ЯР-1001 на 3700 руб. оформлен
Письмо покупателю: заказ ЯР-1002 на 14900 руб. оформлен
Менеджеру: крупный заказ ЯР-1002
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

struct Order {
    let number: String
    let items: [CartItem]

    // 1. Сумма заказа: цена * количество по всем строкам

}

// 2. Тип обработчика: получает заказ, ничего не возвращает


// 3. Центр событий оформления заказа
struct OrderEvents {
    // Подписчики

    // Подписка на все заказы

    // Подписка только на заказы от minTotal руб.

    // Сообщить всем подписчикам о новом заказе

}

// Заказы, которые сейчас оформят покупатели
let blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: true, rating: 4.6)
let chair = Product(name: "Кресло плетёное", price: 12500, category: "Дом", inStock: true, rating: 4.8)
let pillow = Product(name: "Подушка льняная", price: 1200, category: "Дом", inStock: true, rating: 4.5)

let firstOrder = Order(number: "ЯР-1001", items: [
    CartItem(product: blanket, quantity: 1),
    CartItem(product: candle, quantity: 2)
])
let bigOrder = Order(number: "ЯР-1002", items: [
    CartItem(product: chair, quantity: 1),
    CartItem(product: pillow, quantity: 2)
])

// 4. Создай events, подпиши два обработчика и сообщи о двух заказах

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

struct Order {
    let number: String
    let items: [CartItem]

    // 1. Сумма заказа: цена * количество по всем строкам
    var total: Int {
        return items.reduce(0) { $0 + $1.product.price * $1.quantity }
    }
}

// 2. Тип обработчика: получает заказ, ничего не возвращает
typealias OrderHandler = (Order) -> Void

// 3. Центр событий оформления заказа
struct OrderEvents {
    // Подписчики
    var handlers: [OrderHandler] = []

    // Подписка на все заказы
    mutating func subscribe(_ handler: @escaping OrderHandler) {
        handlers.append(handler)
    }

    // Подписка только на заказы от minTotal руб.
    mutating func subscribe(minTotal: Int, _ handler: @escaping OrderHandler) {
        let bigOrdersOnly: OrderHandler = { order in
            if order.total >= minTotal {
                handler(order)
            }
        }
        handlers.append(bigOrdersOnly)
    }

    // Сообщить всем подписчикам о новом заказе
    func notify(_ order: Order) {
        handlers.forEach { $0(order) }
    }
}

// Заказы, которые сейчас оформят покупатели
let blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let candle = Product(name: "Свеча соевая", price: 650, category: "Дом", inStock: true, rating: 4.6)
let chair = Product(name: "Кресло плетёное", price: 12500, category: "Дом", inStock: true, rating: 4.8)
let pillow = Product(name: "Подушка льняная", price: 1200, category: "Дом", inStock: true, rating: 4.5)

let firstOrder = Order(number: "ЯР-1001", items: [
    CartItem(product: blanket, quantity: 1),
    CartItem(product: candle, quantity: 2)
])
let bigOrder = Order(number: "ЯР-1002", items: [
    CartItem(product: chair, quantity: 1),
    CartItem(product: pillow, quantity: 2)
])

// 4. Создай events, подпиши два обработчика и сообщи о двух заказах
var events = OrderEvents()

events.subscribe { order in
    print("Письмо покупателю: заказ \(order.number) на \(order.total) руб. оформлен")
}

events.subscribe(minTotal: 10000) { order in
    print("Менеджеру: крупный заказ \(order.number)")
}

events.notify(firstOrder)
events.notify(bigOrder)
```

## @output
```
Письмо покупателю: заказ ЯР-1001 на 3700 руб. оформлен
Письмо покупателю: заказ ЯР-1002 на 14900 руб. оформлен
Менеджеру: крупный заказ ЯР-1002
```

## @tests
```swift
func __t_order(_ number: String, price: Int, quantity: Int) -> Order {
    let product = Product(name: "Ваза глиняная", price: price, category: "Дом", inStock: true, rating: 4.5)
    return Order(number: number, items: [CartItem(product: product, quantity: quantity)])
}
let __t_blanket = Product(name: "Плед вязаный", price: 2400, category: "Дом", inStock: true, rating: 4.9)
let __t_honey = Product(name: "Мёд липовый", price: 780, category: "Еда", inStock: true, rating: 4.4)
let __t_mixed = Order(number: "ЯР-2001", items: [
    CartItem(product: __t_blanket, quantity: 2),
    CartItem(product: __t_honey, quantity: 3)
])

__eq("total: два пледа и три банки мёда — 7140 руб.", __t_mixed.total, 7140,
     hint: "Для каждой строки заказа умножь цену товара на количество и сложи: items.reduce(0) { ... }")
__eq("total: одна строка, четыре вазы по 2500 руб.", __t_order("ЯР-2002", price: 2500, quantity: 4).total, 10000)
__eq("total: пустой заказ — 0 руб.", Order(number: "ЯР-2003", items: []).total, 0)

var __t_events = OrderEvents()
__eq("Новый центр событий: подписчиков нет", __t_events.handlers.count, 0,
     hint: "Свойство handlers должно начинаться с пустого массива []")
__t_events.notify(__t_mixed)
__pass("notify без подписчиков работает и ничего не ломает")

var __t_log: [String] = []
__t_events.subscribe { order in __t_log.append("письмо \(order.number)") }
__t_events.subscribe { order in __t_log.append("склад \(order.number)") }
__eq("После двух подписок в handlers два обработчика", __t_events.handlers.count, 2,
     hint: "subscribe должен добавлять обработчик в конец handlers")
__eq("Подписка не вызывает обработчик сразу", __t_log, [],
     hint: "subscribe только сохраняет обработчик. Вызывает его notify, когда появится заказ")
__t_events.notify(__t_mixed)
__eq("notify вызывает всех подписчиков в порядке подписки", __t_log, ["письмо ЯР-2001", "склад ЯР-2001"],
     hint: "notify должен вызвать каждый обработчик из handlers по порядку и передать ему заказ")
__t_events.notify(__t_order("ЯР-2004", price: 500, quantity: 1))
__eq("Второй заказ: каждый подписчик вызван ещё раз", __t_log,
     ["письмо ЯР-2001", "склад ЯР-2001", "письмо ЯР-2004", "склад ЯР-2004"])

var __t_big = OrderEvents()
var __t_bigLog: [String] = []
__t_big.subscribe(minTotal: 10000) { order in __t_bigLog.append(order.number) }
__eq("subscribe(minTotal:) тоже добавляет обработчик в handlers", __t_big.handlers.count, 1,
     hint: "subscribe(minTotal:) должен добавить в handlers одно замыкание-обёртку")
__eq("subscribe(minTotal:) не вызывает обработчик сразу", __t_bigLog, [])
__t_big.notify(__t_order("ЯР-3001", price: 9999, quantity: 1))
__eq("Заказ на 9999 руб. — не крупный", __t_bigLog, [],
     hint: "Обёртка из subscribe(minTotal:) вызывает handler, только если order.total >= minTotal")
__t_big.notify(__t_order("ЯР-3002", price: 2500, quantity: 4))
__eq("Заказ ровно на 10000 руб. (4 по 2500) — уже крупный", __t_bigLog, ["ЯР-3002"],
     hint: "Сумма ровно minTotal подходит: нужно сравнение >=. И сравнивай именно order.total — сумму с учётом количества")
__t_big.notify(__t_order("ЯР-3003", price: 15000, quantity: 1))
__eq("Заказ на 15000 руб. — крупный", __t_bigLog, ["ЯР-3002", "ЯР-3003"])

var __t_mix = OrderEvents()
var __t_mixLog: [String] = []
__t_mix.subscribe(minTotal: 5000) { order in __t_mixLog.append("крупный \(order.number)") }
__t_mix.subscribe { order in __t_mixLog.append("любой \(order.number)") }
__t_mix.notify(__t_order("ЯР-4001", price: 1000, quantity: 1))
__t_mix.notify(__t_order("ЯР-4002", price: 6000, quantity: 1))
__eq("Обе подписки в одном центре: порядок подписки сохраняется", __t_mixLog,
     ["любой ЯР-4001", "крупный ЯР-4002", "любой ЯР-4002"],
     hint: "Оба метода subscribe должны добавлять замыкания в один и тот же массив handlers")

var __t_two = OrderEvents()
var __t_twoLog: [String] = []
__t_two.subscribe(minTotal: 3000) { order in __t_twoLog.append("от 3000: \(order.number)") }
__t_two.subscribe(minTotal: 8000) { order in __t_twoLog.append("от 8000: \(order.number)") }
__t_two.notify(__t_order("ЯР-5001", price: 5000, quantity: 1))
__eq("У каждой подписки свой порог minTotal", __t_twoLog, ["от 3000: ЯР-5001"],
     hint: "Замыкание-обёртка должно сравнивать сумму со своим minTotal — тем, что передали при этой подписке")

let __t_typed: [OrderHandler] = __t_events.handlers
let __t_handler: OrderHandler = { (_: Order) -> Void in }
__eq("OrderHandler — это тип (Order) -> Void", __t_typed.count + [__t_handler].count, 3)
```

## @rules
- must: /\.reduce\s*\(/ :: Сумму заказа в свойстве `total` посчитай через `reduce`.
- must: /\.subscribe\s*\(\s*minTotal\s*:\s*10000\s*\)/ :: Менеджера подпиши через `events.subscribe(minTotal: 10000) { ... }` — пусть сумму проверяет центр событий.

## @hint1
Иди по шагам из задания — они отмечены комментариями в редакторе.

Шаг 1. Вычисляемое свойство объявляется через `var`, имя, двоеточие и тип, а потом фигурные скобки с телом. В теле — `reduce` по массиву `items`, как в задаче про итог корзины.

Шаг 2. `typealias`, имя `OrderHandler`, знак равенства и тип замыкания: в скобках `Order`, стрелка, `Void`.

Шаг 3. В `OrderEvents` сначала свойство `handlers` — массив обработчиков, равный пустому массиву. Первый `subscribe` просто добавляет переданный обработчик в этот массив. Оба метода `subscribe` меняют свойство, поэтому помечаются `mutating`, а их параметр-обработчик — `@escaping`: он сохраняется на потом. Во втором `subscribe` создай константу типа `OrderHandler` с новым замыканием. Внутри проверь через `if`, что сумма заказа не меньше `minTotal`, и только тогда вызови исходный `handler`. Эту константу и добавь в массив. Метод `notify` вызывает каждый элемент `handlers`, передавая ему заказ: через `forEach` или через цикл `for`.

Шаг 4. Создай `events` через `var` — методы `subscribe` её меняют. Потом два вызова `subscribe` с замыканиями в хвосте и два вызова `notify`.

## @hint2
Сохранение замыканий и обёртка с условием выглядят так:

```swift
typealias RestockAction = (String) -> Void

var restockActions: [RestockAction] = []

func onRestock(_ action: @escaping RestockAction) {
    restockActions.append(action)
}

func onRestock(only wantedName: String, _ action: @escaping RestockAction) {
    let filtered: RestockAction = { name in
        if name == wantedName {
            action(name)
        }
    }
    restockActions.append(filtered)
}

restockActions.forEach { $0("Ваза глиняная") }
```

У тебя всё то же самое, только внутри структуры: массив — её свойство, а функции — `mutating`-методы.

## @hint3
Заполни пропуски:

```swift
struct Order {
    let number: String
    let items: [CartItem]

    var total: Int {
        return items.reduce(0) { $0 + $1.product.price * $1.quantity }
    }
}

typealias OrderHandler = ___

struct OrderEvents {
    var handlers: [OrderHandler] = []

    mutating func subscribe(_ handler: ___ OrderHandler) {
        handlers.append(handler)
    }

    mutating func subscribe(minTotal: Int, _ handler: @escaping OrderHandler) {
        let bigOrdersOnly: OrderHandler = { order in
            if order.total >= minTotal {
                ___
            }
        }
        handlers.append(bigOrdersOnly)
    }

    func notify(_ order: Order) {
        handlers.forEach { $0(order) }
    }
}

var events = OrderEvents()

events.subscribe { order in
    print("Письмо покупателю: заказ \(order.number) на \(order.total) руб. оформлен")
}

events.subscribe(minTotal: 10000) { order in
    print("Менеджеру: крупный заказ \(order.number)")
}

events.notify(firstOrder)
events.notify(bigOrder)
```

В первом пропуске — тип замыкания, которое получает заказ и ничего не возвращает. Во втором — пометка для замыкания, которое сохраняют на потом. В третьем — вызов исходного обработчика с этим заказом.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает `total`.** Это вычисляемое свойство: его значение не хранится, а считается при каждом обращении. `reduce` начинает с нуля и для каждой строки прибавляет цену товара, умноженную на количество. Для первого заказа это `2400 + 650 * 2 = 3700`.

**Зачем `typealias`.** Тип `(Order) -> Void` встречается в свойстве, в обоих `subscribe` и в обёртке. Имя `OrderHandler` короче и сразу говорит, что это обработчик заказа. Если тип когда-нибудь изменится, править придётся одну строку.

**Зачем `@escaping` и `mutating`.** `subscribe` не вызывает обработчик, а кладёт его в массив. Вызовет его `notify` — намного позже, когда `subscribe` давно закончилась. Значит, замыкание «убегает» из функции, и Swift требует сказать об этом словом `@escaping`. А `mutating` нужен потому, что `append` меняет свойство структуры. По той же причине `events` объявлена через `var`.

**Как работает обёртка.** Во втором `subscribe` в массив попадает не `handler`, а новое замыкание `bigOrdersOnly`. Оно захватило `minTotal` и `handler` — точно так же, как счётчик в задаче про номера заказов. При каждом заказе обёртка сравнивает сумму со своим порогом и только тогда передаёт заказ дальше. У каждой подписки своя обёртка со своим порогом. А `notify` ничего не знает о порогах: он одинаково вызывает все элементы массива.

**Как работает `notify`.** `handlers.forEach { $0(order) }` проходит по массиву по порядку. `$0` — очередной обработчик, а `$0(order)` — его вызов с заказом. Поэтому для крупного заказа сначала пришло письмо покупателю, а потом сообщение менеджеру — в порядке подписки.

**Типичные ошибки:**

- нет `@escaping` — Swift не даст положить замыкание в массив;
- нет `mutating` у `subscribe` или `events` объявлена через `let` — менять свойство структуры нельзя;
- в `subscribe` обработчик вызывается сразу, а не сохраняется: письмо уйдёт до того, как появился заказ;
- в обёртке `>` вместо `>=` — заказ ровно на 10000 руб. не дойдёт до менеджера;
- в обёртке сравнивается цена одного товара, а не `order.total`.
