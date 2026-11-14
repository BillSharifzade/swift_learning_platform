---
title: Кофейня целиком
concept: Итог курса — всё вместе в одном приложении
---

## @description

### Контекст
Помнишь свой первый день в курсе? Тимлид попросил, чтобы приложение кофейни «Лавандовый раф» при запуске выводило приветствие. Ты написала одну команду `print` — и это была твоя первая программа.

С тех пор кофейня выросла, и ты тоже. Тогда бонусные баллы были одной переменной, строка чека — одной интерполяцией, а статус заказа — текстом, который ты меняла вручную. Теперь владелица кофейни просит собрать ядро настоящего приложения:

- меню с ценами для трёх размеров стакана;
- заказ из нескольких напитков разных размеров;
- оплата с бонусными баллами: ими можно оплатить не больше половины заказа, а с оплаченной суммы гость получает 5% баллами;
- статусы заказа, которые меняются только в правильном порядке;
- понятные ошибки вместо падений;
- текст чека.

Это последняя задача курса. Всё, что в ней нужно, ты уже знаешь.

### Что пригодится
- **Перечисления:** сырые значения (`status.rawValue`), `CaseIterable` и `allCases`, `switch` по `self`.
- **Структуры и классы.** Заказ видят и экран гостя, и экран бариста — поэтому `Order` класс, один объект на всех. Позиция заказа и бонусная карта — значения, поэтому структуры.
- **Типизированные ошибки:** `throws(OrderError)`, `throw .emptyOrder`, вызов через `try`. Ошибка, брошенная внутри вызванной функции, сама летит дальше.
- **`inout`-параметр** позволяет функции изменить переданную ей структуру. При вызове перед аргументом ставят `&`.
- **Коллекции и замыкания:** `map`, `reduce`, `sorted(by:)`, `joined(separator:)`.

Пример на других данных — статусы посылки и список строк:

```swift
enum ParcelStatus {
    case created, shipped, delivered

    func canMove(to next: ParcelStatus) -> Bool {
        switch self {
        case .created: return next == .shipped
        case .shipped: return next == .delivered
        case .delivered: return false
        }
    }
}

struct Wallet {
    private(set) var coins: Int
    mutating func spend(_ amount: Int) { coins -= amount }
}

func buySticker(with wallet: inout Wallet) {
    wallet.spend(30)
}

var wallet = Wallet(coins: 100)
buySticker(with: &wallet)        // в wallet осталось 70

let lines = ["Посылка 12", "Статус: в пути"]
print(lines.joined(separator: "\n"))
```

### Задача
Типы `CupSize`, `Drink`, `OrderError`, `LoyaltyCard`, заготовки `Menu`, `OrderItem`, `OrderStatus` и `Order` уже есть. Допиши всё, что помечено `TODO`.

**Меню и позиции**

1. `init(_ drinks: [Drink])` у `Menu` — раскладывает напитки в словарь `drinks` по названию.
2. `func drink(named name: String) throws(OrderError) -> Drink` — напиток по названию. Нет такого — `.unknownDrink(name)`.
3. `var board: [String]` — доска меню: напитки по алфавиту, для каждого цены трёх размеров в порядке `CupSize.allCases`: `Капучино: S 260 / M 300 / L 340 руб.`. Цена размера — `basePrice` плюс `extraPrice`.
4. `var receiptLine: String` у `OrderItem` — строка чека: `Раф лавандовый (M), 2 шт.: 720 руб.` — название, размер, количество и `total`.

**Статусы**

5. `func canMove(to next: OrderStatus) -> Bool` — можно ли перейти в статус `next`:
   - `new` — в `paid` или `cancelled`;
   - `paid` — в `preparing` или `cancelled`;
   - `preparing` — только в `ready`;
   - `ready` — только в `completed`;
   - из `completed` и `cancelled` — никуда.

**Заказ `Order`**

6. `func add(_ drinkName: String, size: CupSize, quantity: Int = 1, from menu: Menu) throws(OrderError)` — `quantity` 0 или меньше: `.invalidQuantity`; затем напиток ищется в меню (его ошибка пробрасывается). Позиция добавляется в конец `items`.
7. `var subtotal: Int` — сумма `total` всех позиций.
8. `func move(to next: OrderStatus) throws(OrderError)` — переход нельзя сделать: `.invalidTransition(from: status, to: next)`. Переход в `paid` при пустом `items`: `.emptyOrder`. Иначе статус меняется.
9. `func pay(with card: inout LoyaltyCard, points: Int) throws(OrderError) -> Int` — оплата с баллами, 1 балл = 1 рубль. По порядку:
   - на карте меньше баллов, чем `points`, — `.notEnoughPoints(available:)` с числом баллов на карте;
   - перевести заказ в `paid` методом из пункта 8 (его ошибки пробрасываются);
   - списать баллы: `points`, но не больше половины `subtotal` (деление нацело). Запомнить их в `pointsUsed`;
   - начислить карте баллы за оплаченную рублями сумму методом `earn(for:)`;
   - вернуть сумму к оплате рублями.
   
   Если брошена ошибка, ни заказ, ни карта не меняются.
10. `func receipt() -> String` — текст чека, строки через `\n`:
    - `Лавандовый раф`
    - `Заказ 47, гость: Билол`
    - по строке `receiptLine` на каждую позицию;
    - `Сумма: 980 руб.`
    - `Баллами: -100 руб.` — только если `pointsUsed` больше 0;
    - `К оплате: 880 руб.`
    - `Статус: ` и `rawValue` статуса.

### Пример
```swift
let order = Order(number: 47, guest: "Билол")
try order.add("Раф лавандовый", size: .medium, quantity: 2, from: menu)
try order.add("Капучино", size: .small, from: menu)
order.subtotal                                   // 980
try order.move(to: .ready)                       // ошибка: invalidTransition(from: .new, to: .ready)

var card = LoyaltyCard(owner: "Билол", points: 100)
try order.pay(with: &card, points: 100)          // 880
card.points                                      // 44: 100 - 100 + 880 / 20
print(order.receipt())
```

```text
Лавандовый раф
Заказ 47, гость: Билол
Раф лавандовый (M), 2 шт.: 720 руб.
Капучино (S), 1 шт.: 260 руб.
Сумма: 980 руб.
Баллами: -100 руб.
К оплате: 880 руб.
Статус: Оплачен
```

## @starter
```swift
// Размер стакана и доплата за него
enum CupSize: String, CaseIterable {
    case small = "S"
    case medium = "M"
    case large = "L"

    var extraPrice: Int {
        switch self {
        case .small: return 0
        case .medium: return 40
        case .large: return 80
        }
    }
}

// Напиток из меню. basePrice — цена размера S
struct Drink {
    let name: String
    let basePrice: Int
}

// Ошибки заказа
enum OrderError: Error, Equatable {
    case unknownDrink(String)
    case invalidQuantity
    case emptyOrder
    case notEnoughPoints(available: Int)
    case invalidTransition(from: OrderStatus, to: OrderStatus)
}

// Бонусная карта гостя: 1 балл = 1 рубль
struct LoyaltyCard {
    let owner: String
    private(set) var points: Int

    init(owner: String, points: Int) {
        self.owner = owner
        self.points = points
    }

    mutating func spend(_ amount: Int) {
        points -= amount
    }

    // 5% от оплаченной рублями суммы возвращаются баллами
    mutating func earn(for paidAmount: Int) {
        points += paidAmount / 20
    }
}

struct Menu {
    private var drinks: [String: Drink] = [:]

    // 1. Разложи напитки по названию
    init(_ list: [Drink]) {
        // TODO
    }

    // 2. Напиток по названию или ошибка unknownDrink
    func drink(named name: String) throws(OrderError) -> Drink {
        // TODO
        throw .unknownDrink(name)
    }

    // 3. Доска меню: "Капучино: S 260 / M 300 / L 340 руб.", по алфавиту
    var board: [String] {
        // TODO
        return []
    }
}

// Позиция заказа
struct OrderItem {
    let drink: Drink
    let size: CupSize
    let quantity: Int

    var unitPrice: Int { drink.basePrice + size.extraPrice }
    var total: Int { unitPrice * quantity }

    // 4. "Раф лавандовый (M), 2 шт.: 720 руб."
    var receiptLine: String {
        // TODO
        return ""
    }
}

// Статус заказа
enum OrderStatus: String {
    case new = "Новый"
    case paid = "Оплачен"
    case preparing = "Готовится"
    case ready = "Готов"
    case completed = "Выдан"
    case cancelled = "Отменён"

    // 5. Можно ли перейти в статус next
    func canMove(to next: OrderStatus) -> Bool {
        // TODO
        return false
    }
}

// Заказ. Класс: его видят и экран гостя, и экран бариста
final class Order {
    let number: Int
    let guest: String
    private(set) var items: [OrderItem] = []
    private(set) var status: OrderStatus = .new
    private(set) var pointsUsed = 0

    init(number: Int, guest: String) {
        self.number = number
        self.guest = guest
    }

    // 6. Добавить напиток
    func add(_ drinkName: String, size: CupSize, quantity: Int = 1, from menu: Menu) throws(OrderError) {
        // TODO
    }

    // 7. Сумма без баллов
    var subtotal: Int {
        // TODO
        return 0
    }

    // 8. Сменить статус
    func move(to next: OrderStatus) throws(OrderError) {
        // TODO
    }

    // 9. Оплата с баллами. Возвращает сумму к оплате рублями
    func pay(with card: inout LoyaltyCard, points: Int) throws(OrderError) -> Int {
        // TODO
        return subtotal
    }

    // 10. Текст чека
    func receipt() -> String {
        // TODO
        return ""
    }
}

// Твоя самая первая строка кода в этом курсе. С неё всё началось
print("Добро пожаловать в Лавандовый раф!")

let menu = Menu([
    Drink(name: "Раф лавандовый", basePrice: 320),
    Drink(name: "Капучино", basePrice: 260),
    Drink(name: "Флэт уайт", basePrice: 290),
    Drink(name: "Какао с зефиром", basePrice: 280)
])
print("Меню дня:")
for line in menu.board {
    print(line)
}

let order = Order(number: 47, guest: "Билол")
var card = LoyaltyCard(owner: "Билол", points: 100)
do {
    try order.add("Раф лавандовый", size: .medium, quantity: 2, from: menu)
    try order.add("Капучино", size: .small, from: menu)
    let toPay = try order.pay(with: &card, points: 100)
    print("Оплачено рублями: \(toPay) руб.")
    try order.move(to: .preparing)
    try order.move(to: .ready)
    print("Заказ \(order.number) готов! Баллов на карте: \(card.points)")
} catch {
    print("Ошибка: \(error)")
}
print(order.receipt())
```

## @solution
```swift
// Размер стакана и доплата за него
enum CupSize: String, CaseIterable {
    case small = "S"
    case medium = "M"
    case large = "L"

    var extraPrice: Int {
        switch self {
        case .small: return 0
        case .medium: return 40
        case .large: return 80
        }
    }
}

// Напиток из меню. basePrice — цена размера S
struct Drink {
    let name: String
    let basePrice: Int
}

// Ошибки заказа
enum OrderError: Error, Equatable {
    case unknownDrink(String)
    case invalidQuantity
    case emptyOrder
    case notEnoughPoints(available: Int)
    case invalidTransition(from: OrderStatus, to: OrderStatus)
}

// Бонусная карта гостя: 1 балл = 1 рубль
struct LoyaltyCard {
    let owner: String
    private(set) var points: Int

    init(owner: String, points: Int) {
        self.owner = owner
        self.points = points
    }

    mutating func spend(_ amount: Int) {
        points -= amount
    }

    // 5% от оплаченной рублями суммы возвращаются баллами
    mutating func earn(for paidAmount: Int) {
        points += paidAmount / 20
    }
}

struct Menu {
    private var drinks: [String: Drink] = [:]

    // 1. Разложи напитки по названию
    init(_ list: [Drink]) {
        for drink in list {
            drinks[drink.name] = drink
        }
    }

    // 2. Напиток по названию или ошибка unknownDrink
    func drink(named name: String) throws(OrderError) -> Drink {
        guard let drink = drinks[name] else {
            throw .unknownDrink(name)
        }
        return drink
    }

    // 3. Доска меню: "Капучино: S 260 / M 300 / L 340 руб.", по алфавиту
    var board: [String] {
        drinks.values.sorted { $0.name < $1.name }.map { drink in
            let prices = CupSize.allCases.map { "\($0.rawValue) \(drink.basePrice + $0.extraPrice)" }
            return "\(drink.name): \(prices.joined(separator: " / ")) руб."
        }
    }
}

// Позиция заказа
struct OrderItem {
    let drink: Drink
    let size: CupSize
    let quantity: Int

    var unitPrice: Int { drink.basePrice + size.extraPrice }
    var total: Int { unitPrice * quantity }

    // 4. "Раф лавандовый (M), 2 шт.: 720 руб."
    var receiptLine: String {
        "\(drink.name) (\(size.rawValue)), \(quantity) шт.: \(total) руб."
    }
}

// Статус заказа
enum OrderStatus: String {
    case new = "Новый"
    case paid = "Оплачен"
    case preparing = "Готовится"
    case ready = "Готов"
    case completed = "Выдан"
    case cancelled = "Отменён"

    // 5. Можно ли перейти в статус next
    func canMove(to next: OrderStatus) -> Bool {
        switch self {
        case .new: return next == .paid || next == .cancelled
        case .paid: return next == .preparing || next == .cancelled
        case .preparing: return next == .ready
        case .ready: return next == .completed
        case .completed, .cancelled: return false
        }
    }
}

// Заказ. Класс: его видят и экран гостя, и экран бариста
final class Order {
    let number: Int
    let guest: String
    private(set) var items: [OrderItem] = []
    private(set) var status: OrderStatus = .new
    private(set) var pointsUsed = 0

    init(number: Int, guest: String) {
        self.number = number
        self.guest = guest
    }

    // 6. Добавить напиток
    func add(_ drinkName: String, size: CupSize, quantity: Int = 1, from menu: Menu) throws(OrderError) {
        guard quantity > 0 else {
            throw .invalidQuantity
        }
        let drink = try menu.drink(named: drinkName)
        items.append(OrderItem(drink: drink, size: size, quantity: quantity))
    }

    // 7. Сумма без баллов
    var subtotal: Int {
        items.reduce(0) { $0 + $1.total }
    }

    // 8. Сменить статус
    func move(to next: OrderStatus) throws(OrderError) {
        guard status.canMove(to: next) else {
            throw .invalidTransition(from: status, to: next)
        }
        if next == .paid && items.isEmpty {
            throw .emptyOrder
        }
        status = next
    }

    // 9. Оплата с баллами. Возвращает сумму к оплате рублями
    func pay(with card: inout LoyaltyCard, points: Int) throws(OrderError) -> Int {
        guard points <= card.points else {
            throw .notEnoughPoints(available: card.points)
        }
        try move(to: .paid)
        pointsUsed = min(points, subtotal / 2)
        let toPay = subtotal - pointsUsed
        card.spend(pointsUsed)
        card.earn(for: toPay)
        return toPay
    }

    // 10. Текст чека
    func receipt() -> String {
        var lines = ["Лавандовый раф", "Заказ \(number), гость: \(guest)"]
        lines += items.map { $0.receiptLine }
        lines.append("Сумма: \(subtotal) руб.")
        if pointsUsed > 0 {
            lines.append("Баллами: -\(pointsUsed) руб.")
        }
        lines.append("К оплате: \(subtotal - pointsUsed) руб.")
        lines.append("Статус: \(status.rawValue)")
        return lines.joined(separator: "\n")
    }
}

// Твоя самая первая строка кода в этом курсе. С неё всё началось
print("Добро пожаловать в Лавандовый раф!")

let menu = Menu([
    Drink(name: "Раф лавандовый", basePrice: 320),
    Drink(name: "Капучино", basePrice: 260),
    Drink(name: "Флэт уайт", basePrice: 290),
    Drink(name: "Какао с зефиром", basePrice: 280)
])
print("Меню дня:")
for line in menu.board {
    print(line)
}

let order = Order(number: 47, guest: "Билол")
var card = LoyaltyCard(owner: "Билол", points: 100)
do {
    try order.add("Раф лавандовый", size: .medium, quantity: 2, from: menu)
    try order.add("Капучино", size: .small, from: menu)
    let toPay = try order.pay(with: &card, points: 100)
    print("Оплачено рублями: \(toPay) руб.")
    try order.move(to: .preparing)
    try order.move(to: .ready)
    print("Заказ \(order.number) готов! Баллов на карте: \(card.points)")
} catch {
    print("Ошибка: \(error)")
}
print(order.receipt())
```

## @tests
```swift
func __t_error(_ body: () throws -> Void) -> OrderError? {
    do {
        try body()
        return nil
    } catch let error as OrderError {
        return error
    } catch {
        return nil
    }
}
let __t_ok: OrderError? = nil
let __t_menu = Menu([
    Drink(name: "Латте", basePrice: 270),
    Drink(name: "Американо", basePrice: 200),
    Drink(name: "Матча", basePrice: 350)
])

__eq("Меню находит напиток по названию", try? __t_menu.drink(named: "Матча").basePrice, 350, hint: "В init разложи напитки в словарь drinks по name, а в drink(named:) читай словарь")
__eq("Неизвестный напиток — ошибка unknownDrink", __t_error { _ = try __t_menu.drink(named: "Мокко") }, .unknownDrink("Мокко"))
__eq("Доска меню: по алфавиту, цены трёх размеров", __t_menu.board, ["Американо: S 200 / M 240 / L 280 руб.", "Латте: S 270 / M 310 / L 350 руб.", "Матча: S 350 / M 390 / L 430 руб."], hint: "Отсортируй напитки по name, для каждого собери цены по CupSize.allCases и соедини через joined(separator: \" / \")")
__eq("Пустое меню — пустая доска", Menu([]).board, [])

__eq("Строка чека для позиции", OrderItem(drink: Drink(name: "Латте", basePrice: 270), size: .large, quantity: 3).receiptLine, "Латте (L), 3 шт.: 1050 руб.", hint: "Формат: название, размер в скобках, запятая, количество и шт., двоеточие, total и руб.")

let __t_allowed: [(OrderStatus, OrderStatus)] = [(.new, .paid), (.new, .cancelled), (.paid, .preparing), (.paid, .cancelled), (.preparing, .ready), (.ready, .completed)]
__ok("Разрешённые переходы статусов", __t_allowed.allSatisfy { $0.0.canMove(to: $0.1) }, hint: "Новый: в Оплачен или Отменён. Оплачен: в Готовится или Отменён. Готовится: в Готов. Готов: в Выдан")
let __t_forbidden: [(OrderStatus, OrderStatus)] = [(.new, .ready), (.new, .new), (.paid, .paid), (.preparing, .cancelled), (.ready, .paid), (.completed, .cancelled), (.cancelled, .new), (.completed, .new)]
__eq("Запрещённые переходы статусов", __t_forbidden.filter { $0.0.canMove(to: $0.1) }.map { "\($0.0.rawValue) -> \($0.1.rawValue)" }, [], hint: "В списке — переходы, которые твой canMove разрешил, хотя не должен")

let __t_order = Order(number: 108, guest: "Билол")
__eq("Количество 0 — invalidQuantity", __t_error { try __t_order.add("Латте", size: .small, quantity: 0, from: __t_menu) }, .invalidQuantity)
__eq("Неизвестный напиток с неверным количеством — сначала invalidQuantity", __t_error { try __t_order.add("Мокко", size: .small, quantity: -1, from: __t_menu) }, .invalidQuantity, hint: "Сначала проверь количество, потом ищи напиток")
__eq("Неизвестный напиток — ошибка из меню", __t_error { try __t_order.add("Мокко", size: .small, from: __t_menu) }, .unknownDrink("Мокко"), hint: "Ищи напиток через try menu.drink(named:) — ошибка пробросится сама")
__eq("Пустой заказ нельзя оплатить", __t_error { try __t_order.move(to: .paid) }, .emptyOrder)
_ = __t_error { try __t_order.add("Латте", size: .medium, quantity: 2, from: __t_menu) }
_ = __t_error { try __t_order.add("Американо", size: .small, from: __t_menu) }
__eq("Позиции добавлены по порядку", __t_order.items.map { $0.receiptLine }, ["Латте (M), 2 шт.: 620 руб.", "Американо (S), 1 шт.: 200 руб."], hint: "Количество по умолчанию — 1. Позиция добавляется в конец items")
__eq("Сумма заказа 620 + 200 = 820", __t_order.subtotal, 820)
__eq("Из нового сразу в Готовится нельзя", __t_error { try __t_order.move(to: .preparing) }, .invalidTransition(from: .new, to: .preparing), hint: "Если status.canMove(to: next) вернул false, брось invalidTransition(from: status, to: next)")

var __t_card = LoyaltyCard(owner: "Билол", points: 300)
__eq("Баллов не хватает — notEnoughPoints", __t_error { _ = try __t_order.pay(with: &__t_card, points: 500) }, .notEnoughPoints(available: 300))
__eq("После отказа карта и статус не изменились", "\(__t_card.points) \(__t_order.status.rawValue)", "300 Новый", hint: "Сначала все проверки, потом изменения")
do {
    let toPay = try __t_order.pay(with: &__t_card, points: 300)
    __eq("Баллами — не больше половины: 820 / 2 = 410, к оплате 520", toPay, 520, hint: "Списывается points, но не больше subtotal / 2. Здесь списано 300, к оплате 820 - 300")
    __eq("Списанные баллы запомнены", __t_order.pointsUsed, 300)
    __eq("Карта: 300 - 300 + 520 / 20 = 26", __t_card.points, 26, hint: "Спиши баллы методом spend и начисли за оплаченную рублями сумму методом earn(for:)")
    __eq("Статус после оплаты — Оплачен", __t_order.status, .paid)
} catch {
    __fail("Оплата заказа баллами", "pay бросил ошибку, хотя баллов хватает: \(error)")
}
__eq("Повторная оплата — invalidTransition", __t_error { _ = try __t_order.pay(with: &__t_card, points: 10) }, .invalidTransition(from: .paid, to: .paid))
__eq("Повторная оплата не тронула ни карту, ни списанные баллы заказа", "\(__t_card.points) \(__t_order.pointsUsed)", "26 300", hint: "Если брошена ошибка, ничего не меняется: сначала проверка баллов и try move(to: .paid), и только потом pointsUsed, spend и earn")
_ = __t_error { try __t_order.move(to: .preparing) }
_ = __t_error { try __t_order.move(to: .ready) }
__eq("Из Готов нельзя отменить", __t_error { try __t_order.move(to: .cancelled) }, .invalidTransition(from: .ready, to: .cancelled))
_ = __t_error { try __t_order.move(to: .completed) }
__eq("Чек с баллами", __t_order.receipt(), "Лавандовый раф\nЗаказ 108, гость: Билол\nЛатте (M), 2 шт.: 620 руб.\nАмерикано (S), 1 шт.: 200 руб.\nСумма: 820 руб.\nБаллами: -300 руб.\nК оплате: 520 руб.\nСтатус: Выдан", hint: "Строки соедини через joined(separator: \"\\n\"). Статус — rawValue")

let __t_big = Order(number: 9, guest: "Билол")
_ = __t_error { try __t_big.add("Матча", size: .large, quantity: 3, from: __t_menu) }
var __t_rich = LoyaltyCard(owner: "Билол", points: 2000)
__eq("Баллов больше половины заказа: списывается ровно половина", (try? __t_big.pay(with: &__t_rich, points: 2000)) ?? -1, 645, hint: "1290 / 2 = 645 баллов, к оплате 1290 - 645 = 645")
__eq("Карта после списания половины: 2000 - 645 + 645 / 20 = 1387", __t_rich.points, 1387)

let __t_cash = Order(number: 10, guest: "Билол")
_ = __t_error { try __t_cash.add("Американо", size: .medium, from: __t_menu) }
var __t_empty = LoyaltyCard(owner: "Билол", points: 0)
__eq("Оплата без баллов: к оплате вся сумма", (try? __t_cash.pay(with: &__t_empty, points: 0)) ?? -1, 240)
__eq("Чек без баллов — без строки Баллами", __t_cash.receipt(), "Лавандовый раф\nЗаказ 10, гость: Билол\nАмерикано (M), 1 шт.: 240 руб.\nСумма: 240 руб.\nК оплате: 240 руб.\nСтатус: Оплачен", hint: "Строку Баллами добавляй, только если pointsUsed больше 0")
__eq("Отмена оплаченного заказа", __t_error { try __t_cash.move(to: .cancelled) }, __t_ok)
```

## @rules
- must: /\bfinal\s+class\s+Order\b/ :: Заказ должен остаться классом: `final class Order`.
- must: /canMove\s*\(\s*to:/ :: В `move(to:)` проверяй переход через `status.canMove(to:)` — правила переходов живут в одном месте.

## @hint1
Иди по номерам — каждый пункт небольшой.

Меню: в `init` цикл по напиткам и запись в словарь по названию. `drink(named:)` — `guard let` и ошибка. Доска: отсортируй напитки по названию, для каждого собери цены по `CupSize.allCases` и соедини их через `" / "`.

Строка позиции — одна интерполяция.

`canMove(to:)` — `switch self`, в каждом случае сравни `next` с разрешёнными статусами.

Заказ. `add`: `guard` на количество, потом `try` поиск в меню, потом добавление. `move(to:)`: сначала спроси у текущего статуса, можно ли перейти, потом отдельно — пустой ли заказ при переходе в «Оплачен», и только потом меняй статус.

`pay`: сначала проверь баллы на карте. Затем вызови `move(to: .paid)` с `try` — если он бросит ошибку, она улетит дальше, а карта останется нетронутой. После этого ошибок уже не бывает: посчитай списание (меньшее из `points` и половины суммы), запомни его, посчитай сумму рублями, спиши и начисли баллы на карте.

Чек: массив строк, необязательную строку добавь через `if`, в конце соедини через перевод строки.

## @hint2
Порядок шагов в оплате — главное:

```swift
guard points <= card.points else {
    throw .notEnoughPoints(available: card.points)
}
try move(to: .paid)
pointsUsed = min(points, subtotal / 2)
let toPay = subtotal - pointsUsed
card.spend(pointsUsed)
card.earn(for: toPay)
return toPay
```

Доска меню — два `map` друг в друге:

```swift
drinks.values.sorted { $0.name < $1.name }.map { drink in
    let prices = CupSize.allCases.map { "\($0.rawValue) \(drink.basePrice + $0.extraPrice)" }
    return "\(drink.name): \(prices.joined(separator: " / ")) руб."
}
```

## @hint3
Заполни пропуски:

```swift
func canMove(to next: OrderStatus) -> Bool {
    switch self {
    case .new: return next == .paid || next == .cancelled
    case .paid: return ___
    case .preparing: return next == .ready
    case .ready: return next == .completed
    case .completed, .cancelled: return false
    }
}

func add(_ drinkName: String, size: CupSize, quantity: Int = 1, from menu: Menu) throws(OrderError) {
    guard quantity > 0 else {
        throw .invalidQuantity
    }
    let drink = ___
    items.append(OrderItem(drink: drink, size: size, quantity: quantity))
}

func move(to next: OrderStatus) throws(OrderError) {
    guard status.canMove(to: next) else {
        throw .invalidTransition(from: status, to: next)
    }
    if next == .paid && items.isEmpty {
        throw .emptyOrder
    }
    status = next
}

func receipt() -> String {
    var lines = ["Лавандовый раф", "Заказ \(number), гость: \(guest)"]
    lines += items.map { $0.receiptLine }
    lines.append("Сумма: \(subtotal) руб.")
    if pointsUsed > 0 {
        lines.append("Баллами: -\(pointsUsed) руб.")
    }
    lines.append("К оплате: \(subtotal - pointsUsed) руб.")
    lines.append("Статус: \(status.rawValue)")
    return ___
}
```

В первом пропуске — куда можно перейти из «Оплачен». Во втором — поиск напитка в меню с `try`. В третьем — строки, соединённые переводом строки.

## @hint4
Вот готовое решение:

{{solution}}

**Как устроено ядро.** Каждый тип отвечает за своё. `Menu` знает цены и названия. `OrderItem` умеет посчитать и описать одну позицию. `OrderStatus` хранит правила переходов — в одном месте, а не разбросанными по коду. `Order` собирает всё вместе: позиции, статус, оплату и чек. `LoyaltyCard` — структура, и `pay` меняет её через `inout`: гость видит новые баллы сразу после оплаты.

**Почему `move(to:)` спрашивает `canMove`.** Статус — конечный автомат: из каждого состояния есть только определённые выходы. Если правила живут в `canMove`, их легко прочитать, проверить и поменять. А `move(to:)` только применяет их и сообщает об ошибке.

**Почему в `pay` именно такой порядок.** Сначала идут шаги, которые могут бросить ошибку: проверка баллов и `try move(to: .paid)`. Всё, что меняет карту и заказ, стоит после них, где ошибок уже не бывает. Поэтому отказ никогда не оставляет списанные баллы у неоплаченного заказа. Это то же правило, что и в банке из третьей задачи, — правило всех программ, которые работают с деньгами.

**Что изменилось с первого дня.** В первом модуле бонусы были одной переменной `bonusPoints`, строка чека — одной интерполяцией, а статус ты меняла присваиванием `status = "Готовится"`. Теперь те же идеи стали типами с правилами, ошибками и проверками. Именно так из маленьких строчек вырастают настоящие приложения.

**Типичные ошибки:**

- в `pay` сначала списываются баллы, а потом вызывается `move(to: .paid)` — при ошибке баллы пропадают;
- баллы не ограничены половиной суммы — гость оплачивает баллами весь заказ;
- `earn(for: subtotal)` вместо `earn(for: toPay)` — баллы начисляются и за ту часть, что оплачена баллами;
- строка «Баллами» печатается всегда, даже с нулём.
