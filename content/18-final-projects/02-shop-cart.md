---
title: Корзина книжного магазина
concept: Итог курса — протоколы-стратегии, ошибки, дженерики
---

## @description

### Контекст
Небольшой книжный магазин «Переплёт» открывает продажи в приложении. Тебе досталась корзина — самая ответственная часть: от неё зависят деньги.

Менеджер магазина описала правила в тикете. Книги лежат в каталоге и ищутся по артикулу. Купить больше, чем есть на складе, нельзя. Скидок у магазина несколько, и они всё время меняются: процент от большой суммы, «третья книга в подарок», купоны. Покупателю применяется **одна** — самая выгодная.

Тимлид добавил к тикету: «Скидки сделай стратегиями через протокол, чтобы новую акцию можно было добавить, не трогая корзину. А каталог сделай обобщённым: скоро в нём появятся подарочные карты и закладки, не только книги».

### Что пригодится
- **Протокол как правило поведения.** Каждая скидка — отдельная структура, подписанная под протокол. Корзина работает со списком `[any DiscountRule]` и не знает, какие именно правила внутри.
- **Обобщённый тип с ограничением.** `struct Catalog<Item: Identifiable>` подходит для любых элементов со свойством `id`. Тип артикула у них может быть разным, он называется `Item.ID`.
- **Типизированные ошибки.** `throws(CartError)` говорит: функция может бросить только `CartError`.
- **Замыкания для коллекций:** `reduce`, `sorted()`, `prefix`, `flatMap`, `first(where:)`, `firstIndex(where:)`. И ещё `Array(repeating: 5, count: 3)` — это `[5, 5, 5]`.

Пример на других данных — способы доставки:

```swift
protocol ShippingOption {
    var title: String { get }
    func cost(forWeight grams: Int) -> Int
}

struct Courier: ShippingOption {
    let pricePerKilo: Int
    var title: String { "Курьер, \(pricePerKilo) руб. за кг" }
    func cost(forWeight grams: Int) -> Int {
        (grams + 999) / 1000 * pricePerKilo
    }
}

let options: [any ShippingOption] = [Courier(pricePerKilo: 90)]
let cheapest = options.map { $0.cost(forWeight: 2500) }.min() ?? 0   // 270
```

Обобщённый тип и ошибка с данными:

```swift
struct Registry<Entry: Identifiable> {
    private var entries: [Entry.ID: Entry] = [:]
    mutating func register(_ entry: Entry) {
        entries[entry.id] = entry
    }
}

enum PromoError: Error {
    case unknown(code: String)
}

func check(_ code: String) throws(PromoError) {
    guard code.hasPrefix("SALE") else {
        throw .unknown(code: code)
    }
}
```

### Задача
Типы `Book`, `CartLine`, `CartError`, `AppliedDiscount` и протокол `DiscountRule` уже готовы. Допиши всё, что помечено `TODO`.

**Каталог `Catalog<Item: Identifiable>`**

1. `init(_ items: [Item])` — раскладывает элементы в словарь `itemsByID` по их `id`. Если `id` повторяется, остаётся **последний** элемент.
2. `var count: Int` — сколько разных элементов в каталоге.
3. `func item(withID id: Item.ID) -> Item?` — элемент с таким `id` или `nil`.

**Скидки.** Три структуры уже подписаны под `DiscountRule`. Допиши у каждой свойство `title` и метод `discount(for:)` — он возвращает сумму скидки в рублях для строк корзины.

4. `PercentDiscount` — `title`: `Скидка 10% от 3000 руб.` (числа из `percent` и `minTotal`). Если сумма строк не меньше `minTotal`, скидка — `percent` процентов от суммы, деление нацело. Иначе `0`.
5. `ThirdBookFree` — `title`: `Третья книга в подарок`. Считаются **экземпляры**: строка с `quantity: 3` — это три книги. Из каждых трёх экземпляров один бесплатный, и бесплатными становятся самые дешёвые. Скидка — сумма цен этих экземпляров. Семь книг — две бесплатные.
6. `Coupon` — `title`: `Купон` и код через пробел: `Купон BOOK500`. Скидка — `amount`, но не больше суммы строк.

**Корзина `Cart`**

7. `mutating func add(bookID: String, quantity: Int) throws(CartError)` — проверки строго по порядку:
   - `quantity` 0 или меньше — `.invalidQuantity(quantity)`;
   - книги нет в каталоге — `.unknownBook(id: bookID)`;
   - эта книга в корзине вместе с новыми превысит `stock` — `.notEnoughStock(title:available:)`, где `available` — сколько ещё можно добавить (`stock` минус уже лежащие в корзине);
   - если книга уже есть в `lines`, увеличь её `quantity`, иначе добавь новую строку в конец.
8. `var subtotal: Int` — сумма `total` всех строк.
9. `func bestDiscount(from rules: [any DiscountRule]) -> AppliedDiscount?` — самая большая скидка среди правил: её `title` и сумма. Сумма не может быть больше `subtotal`. Если скидки равны, побеждает правило, которое раньше в списке. Если все скидки `0` или правил нет — `nil`.
10. `func checkout(rules: [any DiscountRule]) throws(CartError) -> Int` — пустая корзина: `.emptyCart`. Иначе — `subtotal` минус лучшая скидка.

### Пример
```swift
var cart = Cart(catalog: Catalog(books))
try cart.add(bookID: "B-101", quantity: 2)     // Война и мир, 1200 руб.
try cart.add(bookID: "B-103", quantity: 1)     // Горе от ума, 380 руб.
try cart.add(bookID: "B-104", quantity: 2)     // ошибка: notEnoughStock(title: "Двенадцать стульев", available: 1)
cart.subtotal                                  // 2780
cart.bestDiscount(from: rules)                 // Купон BOOK500, 500
try cart.checkout(rules: rules)                // 2280
```

## @starter
```swift
// Книга в каталоге. id — артикул
struct Book: Identifiable {
    let id: String
    let title: String
    let price: Int   // цена в рублях
    let stock: Int   // сколько штук на складе
}

// Строка корзины: книга и количество
struct CartLine {
    let book: Book
    var quantity: Int
    var total: Int { book.price * quantity }
}

// Ошибки корзины
enum CartError: Error, Equatable {
    case invalidQuantity(Int)                          // количество 0 или меньше
    case unknownBook(id: String)                       // такого артикула нет
    case notEnoughStock(title: String, available: Int) // столько на складе нет
    case emptyCart                                     // пустую корзину не оформить
}

// Правило скидки. У магазина их несколько, корзина выбирает самое выгодное
protocol DiscountRule {
    var title: String { get }
    func discount(for lines: [CartLine]) -> Int   // сумма скидки в рублях
}

// Скидка, которую выбрала корзина
struct AppliedDiscount: Equatable {
    let title: String
    let amount: Int
}

// Каталог чего угодно с артикулом: книг, подарочных карт, закладок
struct Catalog<Item: Identifiable> {
    private var itemsByID: [Item.ID: Item] = [:]

    // 1. Разложи элементы по id. При повторе остаётся последний
    init(_ items: [Item]) {
        // TODO
    }

    // 2. Сколько разных элементов в каталоге
    var count: Int {
        // TODO
        return 0
    }

    // 3. Элемент по id или nil
    func item(withID id: Item.ID) -> Item? {
        // TODO
        return nil
    }
}

// 4. Процент от суммы, если сумма не меньше minTotal
struct PercentDiscount: DiscountRule {
    let percent: Int
    let minTotal: Int

    var title: String {
        // TODO
        return ""
    }

    func discount(for lines: [CartLine]) -> Int {
        // TODO
        return 0
    }
}

// 5. Из каждых трёх экземпляров самый дешёвый бесплатно
struct ThirdBookFree: DiscountRule {
    var title: String {
        // TODO
        return ""
    }

    func discount(for lines: [CartLine]) -> Int {
        // TODO: список цен всех экземпляров, сортировка, самые дешёвые
        return 0
    }
}

// 6. Купон на фиксированную сумму, но не больше суммы корзины
struct Coupon: DiscountRule {
    let code: String
    let amount: Int

    var title: String {
        // TODO
        return ""
    }

    func discount(for lines: [CartLine]) -> Int {
        // TODO
        return 0
    }
}

struct Cart {
    let catalog: Catalog<Book>
    private(set) var lines: [CartLine] = []

    // 7. Добавить книгу. Проверки строго по порядку из задания
    mutating func add(bookID: String, quantity: Int) throws(CartError) {
        // TODO
    }

    // 8. Сумма без скидки
    var subtotal: Int {
        // TODO
        return 0
    }

    // 9. Самая выгодная скидка или nil
    func bestDiscount(from rules: [any DiscountRule]) -> AppliedDiscount? {
        // TODO
        return nil
    }

    // 10. Итог к оплате
    func checkout(rules: [any DiscountRule]) throws(CartError) -> Int {
        // TODO
        return 0
    }
}

// Так приложение пользуется корзиной
let books = [
    Book(id: "B-101", title: "Война и мир", price: 1200, stock: 5),
    Book(id: "B-102", title: "Собачье сердце", price: 450, stock: 2),
    Book(id: "B-103", title: "Горе от ума", price: 380, stock: 10),
    Book(id: "B-104", title: "Двенадцать стульев", price: 690, stock: 1)
]
let rules: [any DiscountRule] = [
    PercentDiscount(percent: 10, minTotal: 3000), ThirdBookFree(), Coupon(code: "BOOK500", amount: 500)
]

var cart = Cart(catalog: Catalog(books))
let wishes = [("B-101", 2), ("B-103", 1), ("B-104", 1), ("B-104", 1), ("B-999", 1), ("B-102", 0)]
for (id, quantity) in wishes {
    do {
        try cart.add(bookID: id, quantity: quantity)
    } catch {
        print("Не добавлено \(id): \(error)")
    }
}
print("Сумма: \(cart.subtotal) руб.")
if let discount = cart.bestDiscount(from: rules) {
    print("\(discount.title): -\(discount.amount) руб.")
}
do {
    print("К оплате: \(try cart.checkout(rules: rules)) руб.")
} catch {
    print("Оформить не получилось: \(error)")
}
```

## @solution
```swift
// Книга в каталоге. id — артикул
struct Book: Identifiable {
    let id: String
    let title: String
    let price: Int   // цена в рублях
    let stock: Int   // сколько штук на складе
}

// Строка корзины: книга и количество
struct CartLine {
    let book: Book
    var quantity: Int
    var total: Int { book.price * quantity }
}

// Ошибки корзины
enum CartError: Error, Equatable {
    case invalidQuantity(Int)                          // количество 0 или меньше
    case unknownBook(id: String)                       // такого артикула нет
    case notEnoughStock(title: String, available: Int) // столько на складе нет
    case emptyCart                                     // пустую корзину не оформить
}

// Правило скидки. У магазина их несколько, корзина выбирает самое выгодное
protocol DiscountRule {
    var title: String { get }
    func discount(for lines: [CartLine]) -> Int   // сумма скидки в рублях
}

// Скидка, которую выбрала корзина
struct AppliedDiscount: Equatable {
    let title: String
    let amount: Int
}

// Каталог чего угодно с артикулом: книг, подарочных карт, закладок
struct Catalog<Item: Identifiable> {
    private var itemsByID: [Item.ID: Item] = [:]

    // 1. Разложи элементы по id. При повторе остаётся последний
    init(_ items: [Item]) {
        for item in items {
            itemsByID[item.id] = item
        }
    }

    // 2. Сколько разных элементов в каталоге
    var count: Int {
        itemsByID.count
    }

    // 3. Элемент по id или nil
    func item(withID id: Item.ID) -> Item? {
        itemsByID[id]
    }
}

// 4. Процент от суммы, если сумма не меньше minTotal
struct PercentDiscount: DiscountRule {
    let percent: Int
    let minTotal: Int

    var title: String {
        "Скидка \(percent)% от \(minTotal) руб."
    }

    func discount(for lines: [CartLine]) -> Int {
        let sum = lines.reduce(0) { $0 + $1.total }
        return sum >= minTotal ? sum * percent / 100 : 0
    }
}

// 5. Из каждых трёх экземпляров самый дешёвый бесплатно
struct ThirdBookFree: DiscountRule {
    var title: String {
        "Третья книга в подарок"
    }

    func discount(for lines: [CartLine]) -> Int {
        let prices = lines.flatMap { Array(repeating: $0.book.price, count: $0.quantity) }
        let freeCount = prices.count / 3
        return prices.sorted().prefix(freeCount).reduce(0, +)
    }
}

// 6. Купон на фиксированную сумму, но не больше суммы корзины
struct Coupon: DiscountRule {
    let code: String
    let amount: Int

    var title: String {
        "Купон \(code)"
    }

    func discount(for lines: [CartLine]) -> Int {
        let sum = lines.reduce(0) { $0 + $1.total }
        return min(amount, sum)
    }
}

struct Cart {
    let catalog: Catalog<Book>
    private(set) var lines: [CartLine] = []

    // 7. Добавить книгу. Проверки строго по порядку из задания
    mutating func add(bookID: String, quantity: Int) throws(CartError) {
        guard quantity > 0 else {
            throw .invalidQuantity(quantity)
        }
        guard let book = catalog.item(withID: bookID) else {
            throw .unknownBook(id: bookID)
        }
        let alreadyInCart = lines.first(where: { $0.book.id == bookID })?.quantity ?? 0
        guard alreadyInCart + quantity <= book.stock else {
            throw .notEnoughStock(title: book.title, available: book.stock - alreadyInCart)
        }
        if let index = lines.firstIndex(where: { $0.book.id == bookID }) {
            lines[index].quantity += quantity
        } else {
            lines.append(CartLine(book: book, quantity: quantity))
        }
    }

    // 8. Сумма без скидки
    var subtotal: Int {
        lines.reduce(0) { $0 + $1.total }
    }

    // 9. Самая выгодная скидка или nil
    func bestDiscount(from rules: [any DiscountRule]) -> AppliedDiscount? {
        var best: AppliedDiscount?
        for rule in rules {
            let amount = min(rule.discount(for: lines), subtotal)
            if amount > (best?.amount ?? 0) {
                best = AppliedDiscount(title: rule.title, amount: amount)
            }
        }
        return best
    }

    // 10. Итог к оплате
    func checkout(rules: [any DiscountRule]) throws(CartError) -> Int {
        guard !lines.isEmpty else {
            throw .emptyCart
        }
        return subtotal - (bestDiscount(from: rules)?.amount ?? 0)
    }
}

// Так приложение пользуется корзиной
let books = [
    Book(id: "B-101", title: "Война и мир", price: 1200, stock: 5),
    Book(id: "B-102", title: "Собачье сердце", price: 450, stock: 2),
    Book(id: "B-103", title: "Горе от ума", price: 380, stock: 10),
    Book(id: "B-104", title: "Двенадцать стульев", price: 690, stock: 1)
]
let rules: [any DiscountRule] = [
    PercentDiscount(percent: 10, minTotal: 3000), ThirdBookFree(), Coupon(code: "BOOK500", amount: 500)
]

var cart = Cart(catalog: Catalog(books))
let wishes = [("B-101", 2), ("B-103", 1), ("B-104", 1), ("B-104", 1), ("B-999", 1), ("B-102", 0)]
for (id, quantity) in wishes {
    do {
        try cart.add(bookID: id, quantity: quantity)
    } catch {
        print("Не добавлено \(id): \(error)")
    }
}
print("Сумма: \(cart.subtotal) руб.")
if let discount = cart.bestDiscount(from: rules) {
    print("\(discount.title): -\(discount.amount) руб.")
}
do {
    print("К оплате: \(try cart.checkout(rules: rules)) руб.")
} catch {
    print("Оформить не получилось: \(error)")
}
```

## @tests
```swift
struct __t_Card: Identifiable {
    let id: Int
    let nominal: Int
}
struct __t_FixedRule: DiscountRule {
    let title: String
    let amount: Int
    func discount(for lines: [CartLine]) -> Int { amount }
}
func __t_book(_ id: String, _ price: Int, stock: Int = 10) -> Book {
    Book(id: id, title: "Книга \(id)", price: price, stock: stock)
}
func __t_lines(_ pairs: [(Int, Int)]) -> [CartLine] {
    pairs.enumerated().map { CartLine(book: __t_book("L\($0.offset)", $0.element.0), quantity: $0.element.1) }
}
func __t_add(_ cart: inout Cart, _ id: String, _ quantity: Int) -> CartError? {
    do {
        try cart.add(bookID: id, quantity: quantity)
        return nil
    } catch let error as CartError {
        return error
    } catch {
        return nil
    }
}
let __t_noError: CartError? = nil

let __t_catalog = Catalog([__t_book("A", 500, stock: 3), __t_book("B", 300), __t_book("C", 800)])
__eq("Каталог из трёх книг: count = 3", __t_catalog.count, 3, hint: "count — это количество элементов в словаре itemsByID")
__eq("Каталог находит книгу по артикулу", __t_catalog.item(withID: "B")?.price, 300, hint: "В init разложи элементы в itemsByID по ключу id, а в item(withID:) читай словарь по ключу")
__eq("Каталог возвращает nil для неизвестного артикула", __t_catalog.item(withID: "Z")?.price, nil)
let __t_dup = Catalog([__t_book("A", 100), __t_book("A", 999), __t_book("B", 1)])
__eq("Повтор артикула: в каталоге 2 элемента", __t_dup.count, 2, hint: "При повторе id элемент не добавляется второй раз, а заменяет старый")
__eq("Повтор артикула: остаётся последний элемент", __t_dup.item(withID: "A")?.price, 999, hint: "Записывай в словарь по очереди: dict[item.id] = item. Тогда последний перезапишет предыдущий")
let __t_cards = Catalog([__t_Card(id: 7, nominal: 1000), __t_Card(id: 9, nominal: 3000)])
__eq("Каталог обобщённый: подарочные карты с числовым id", __t_cards.item(withID: 9)?.nominal, 3000, hint: "Каталог должен работать с любым Item: Identifiable, не только с книгами")

let __t_percent = PercentDiscount(percent: 15, minTotal: 2000)
__eq("Название процентной скидки", __t_percent.title, "Скидка 15% от 2000 руб.")
__eq("Процентная скидка: 1999 руб. меньше порога — 0", __t_percent.discount(for: __t_lines([(1999, 1)])), 0)
__eq("Процентная скидка: ровно на пороге 2000 руб. — 300", __t_percent.discount(for: __t_lines([(1000, 2)])), 300, hint: "Скидка действует, если сумма не меньше minTotal: сравнение >=")
__eq("Процентная скидка: 4200 руб. — 630", __t_percent.discount(for: __t_lines([(1500, 2), (600, 2)])), 630, hint: "Сумма строк считается с учётом quantity: price * quantity")

let __t_free = ThirdBookFree()
__eq("Название акции", __t_free.title, "Третья книга в подарок")
__eq("Акция: две книги — скидки нет", __t_free.discount(for: __t_lines([(500, 1), (300, 1)])), 0)
__eq("Акция: три разные книги — бесплатна самая дешёвая", __t_free.discount(for: __t_lines([(700, 1), (250, 1), (400, 1)])), 250)
__eq("Акция: одна строка с quantity 3 — один экземпляр бесплатно", __t_free.discount(for: __t_lines([(450, 3)])), 450, hint: "Считай экземпляры, а не строки: строка с quantity 3 — это три книги")
__eq("Акция: семь экземпляров — две самые дешёвые бесплатно", __t_free.discount(for: __t_lines([(900, 2), (300, 1), (500, 4)])), 800, hint: "7 книг / 3 = 2 бесплатные. Отсортируй цены всех экземпляров по возрастанию и сложи первые две")

__eq("Название купона", Coupon(code: "READ300", amount: 300).title, "Купон READ300")
__eq("Купон 300 руб. на корзину в 1000 руб. — 300", Coupon(code: "READ300", amount: 300).discount(for: __t_lines([(1000, 1)])), 300)
__eq("Купон не больше суммы корзины", Coupon(code: "BIG", amount: 5000).discount(for: __t_lines([(400, 2)])), 800, hint: "Скидка купона — меньшее из amount и суммы строк")

var __t_cart = Cart(catalog: __t_catalog)
__eq("Количество 0 — ошибка invalidQuantity(0)", __t_add(&__t_cart, "A", 0), .invalidQuantity(0), hint: "Первая проверка: quantity должно быть больше нуля")
__eq("Неизвестный артикул и неверное количество — сначала invalidQuantity", __t_add(&__t_cart, "Z", -2), .invalidQuantity(-2), hint: "Проверки идут строго по порядку: сначала количество, потом каталог")
__eq("Неизвестный артикул — ошибка unknownBook", __t_add(&__t_cart, "Z", 1), .unknownBook(id: "Z"))
__eq("Добавление 2 книг A — без ошибки", __t_add(&__t_cart, "A", 2), __t_noError)
__eq("Ещё 2 книги A при остатке 3 — notEnoughStock, можно добавить ещё 1", __t_add(&__t_cart, "A", 2), .notEnoughStock(title: "Книга A", available: 1), hint: "Учитывай книги, которые уже лежат в корзине: available = stock минус уже в корзине")
__eq("После ошибки корзина не изменилась", __t_cart.lines.map { $0.quantity }, [2], hint: "Если брошена ошибка, корзина должна остаться прежней")
__eq("Ещё 1 книга A — ровно весь склад, без ошибки", __t_add(&__t_cart, "A", 1), __t_noError, hint: "Взять ровно столько, сколько на складе, можно: сравнение <=")
_ = __t_add(&__t_cart, "C", 1)
__eq("Повтор книги увеличивает quantity, а не добавляет строку", __t_cart.lines.map { $0.quantity }, [3, 1], hint: "Если книга уже есть в lines, увеличь quantity этой строки по индексу")
__eq("Сумма корзины: 3 x 500 + 800 = 2300", __t_cart.subtotal, 2300)

let __t_rules: [any DiscountRule] = [Coupon(code: "MINI", amount: 200), PercentDiscount(percent: 10, minTotal: 2000), __t_FixedRule(title: "Тоже 230", amount: 230)]
__eq("Лучшая скидка — самая большая, при равенстве первая", __t_cart.bestDiscount(from: __t_rules), AppliedDiscount(title: "Скидка 10% от 2000 руб.", amount: 230), hint: "Перебери правила и запоминай скидку, только если она строго больше лучшей найденной")
__eq("Две одинаковые скидки — побеждает первая в списке", __t_cart.bestDiscount(from: [__t_FixedRule(title: "Первая", amount: 100), __t_FixedRule(title: "Вторая", amount: 100)])?.title, "Первая", hint: "Заменяй лучшую скидку, только если новая строго больше: >, а не >=")
__eq("Скидка не больше суммы корзины", __t_cart.bestDiscount(from: [__t_FixedRule(title: "Ошибка акции", amount: 99999)]), AppliedDiscount(title: "Ошибка акции", amount: 2300), hint: "Ограничь сумму скидки сверху значением subtotal: min(...)")
__eq("Все скидки нулевые — nil", __t_cart.bestDiscount(from: [__t_FixedRule(title: "Ноль", amount: 0), PercentDiscount(percent: 50, minTotal: 10000)]), nil, hint: "Если ни одно правило не даёт скидку больше нуля, верни nil")
__eq("Нет правил — nil", __t_cart.bestDiscount(from: []), nil)
do {
    __eq("К оплате: 2300 - 230 = 2070", try __t_cart.checkout(rules: __t_rules), 2070, hint: "Итог — subtotal минус сумма лучшей скидки")
    __eq("К оплате без правил — вся сумма", try __t_cart.checkout(rules: []), 2300)
} catch {
    __fail("Оформление заполненной корзины", "Для непустой корзины checkout не должен бросать ошибку, а бросил \(error)")
}
do {
    _ = try Cart(catalog: __t_catalog).checkout(rules: __t_rules)
    __fail("Пустая корзина — ошибка emptyCart", "checkout для пустой корзины должен бросить CartError.emptyCart")
} catch let error as CartError {
    __eq("Пустая корзина — ошибка emptyCart", error, .emptyCart)
} catch {
    __fail("Пустая корзина — ошибка emptyCart", "Брошена ошибка другого типа")
}
```

## @rules
- mustnot: /\bas[?!]?\s+(PercentDiscount|ThirdBookFree|Coupon)\b|\bis\s+(PercentDiscount|ThirdBookFree|Coupon)\b/ :: Корзина не должна выяснять, какая именно скидка перед ней: вызывай `discount(for:)` и `title` у правила через протокол.

## @hint1
Иди по номерам из задания и нажимай «Проверить» после каждой части.

Каталог: в `init` пройди циклом по элементам и запиши каждый в словарь по ключу `id` — повтор сам перезапишет старое значение. `count` и `item(withID:)` — по одной строке про словарь.

Скидки: у каждой структуры замени заглушки в `title` и `discount(for:)`. Название собирается интерполяцией из свойств структуры. Сумму строк удобно считать через `reduce`. Для акции «третья в подарок» сначала преврати строки в список цен всех экземпляров, потом отсортируй, возьми столько самых дешёвых, сколько полных троек, и сложи.

Корзина: в `add` три `guard` подряд в порядке из задания, потом обновление. Чтобы проверить склад, узнай, сколько этой книги уже лежит в корзине: найди индекс строки через `firstIndex(where:)`. В `bestDiscount` перебери правила циклом и держи лучшую найденную скидку. `checkout` — один `guard` и вычитание.

## @hint2
Подпись под протокол и акция «третья в подарок»:

```swift
struct ThirdBookFree: DiscountRule {
    var title: String {
        "Третья книга в подарок"
    }

    func discount(for lines: [CartLine]) -> Int {
        let prices = lines.flatMap { Array(repeating: $0.book.price, count: $0.quantity) }
        let freeCount = prices.count / 3
        return prices.sorted().prefix(freeCount).reduce(0, +)
    }
}
```

Сколько книги уже в корзине и как изменить найденную строку:

```swift
let alreadyInCart = lines.first(where: { $0.book.id == bookID })?.quantity ?? 0

if let index = lines.firstIndex(where: { $0.book.id == bookID }) {
    lines[index].quantity += quantity
}
```

Если книги в корзине ещё нет, `first(where:)` вернёт `nil`, а `??` превратит его в ноль. Менять строку нужно по индексу: `first(where:)` дал бы копию.

## @hint3
Каталог и скидки пишутся по образцам из прошлых подсказок. Заполни пропуски в корзине:

```swift
mutating func add(bookID: String, quantity: Int) throws(CartError) {
    guard quantity > 0 else {
        throw .invalidQuantity(quantity)
    }
    guard let book = catalog.item(withID: bookID) else {
        throw ___
    }
    let alreadyInCart = lines.first(where: { $0.book.id == bookID })?.quantity ?? 0
    guard alreadyInCart + quantity <= book.stock else {
        throw .notEnoughStock(title: book.title, available: ___)
    }
    if let index = lines.firstIndex(where: { $0.book.id == bookID }) {
        lines[index].quantity += quantity
    } else {
        lines.append(CartLine(book: book, quantity: quantity))
    }
}

func bestDiscount(from rules: [any DiscountRule]) -> AppliedDiscount? {
    var best: AppliedDiscount?
    for rule in rules {
        let amount = min(rule.discount(for: lines), subtotal)
        if amount > ___ {
            best = AppliedDiscount(title: rule.title, amount: amount)
        }
    }
    return best
}
```

В первом пропуске — ошибка про неизвестный артикул. Во втором — сколько ещё можно добавить. В третьем — сумма лучшей скидки на этот момент, а если её ещё нет, то ноль.

## @hint4
Вот готовое решение:

{{solution}}

**Почему скидки — стратегии.** Корзина видит только протокол: у правила есть название и метод, который считает сумму. Ей всё равно, процент это, купон или новая акция «чёрной пятницы». Чтобы добавить акцию, достаточно написать ещё одну структуру с `: DiscountRule` — корзину трогать не придётся. Проверка это тоже знает: она подсовывает корзине собственное правило, которого нет в твоём коде.

**Почему каталог обобщённый.** `Catalog<Item: Identifiable>` ничего не знает о книгах. Ограничение `Identifiable` обещает только одно: у элемента есть `id`, и его можно сделать ключом словаря. Поэтому тот же каталог хранит и подарочные карты с числовым `id`.

**Почему проверки в `add` идут именно так.** Каждый `guard` отсекает один плохой случай и сразу бросает ошибку. Корзина меняется только в самом конце, когда все проверки пройдены, — поэтому после ошибки она остаётся прежней. При проверке склада важно учесть то, что уже лежит в корзине: иначе по одной книге можно набрать больше, чем есть.

**Почему `>` в `bestDiscount`.** Строгое «больше» не даёт правилу с такой же скидкой вытеснить предыдущее, и при равенстве побеждает первое. А начальное значение `0` через `??` заодно отсекает нулевые скидки — тогда функция вернёт `nil`.

**Типичные ошибки:**

- `Dictionary(uniqueKeysWithValues:)` в каталоге — он аварийно останавливает программу при повторе ключа;
- в акции считаются строки, а не экземпляры, и `quantity` теряется;
- проверка склада сравнивает только новое количество со `stock`, без уже лежащих книг;
- проверки в `add` переставлены местами — тогда для `quantity: 0` и неизвестного артикула придёт не та ошибка.
