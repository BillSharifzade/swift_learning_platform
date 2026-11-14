---
title: Банковское ядро
concept: Итог курса — классы, ошибки, Result, история операций
---

## @description

### Контекст
Банк «Маяк» запускает новое мобильное приложение и переписывает его ядро — код, который хранит счета и двигает деньги. Тебе доверили самую строгую часть: пополнения, списания, переводы и историю операций.

Ведущий разработчик объясняет требования на созвоне: «Деньги не появляются из ниоткуда и не исчезают. Если перевод не прошёл, ни на одном счёте не должно измениться ни рубля. Каждая операция попадает в историю, а на каждый отказ у пользователя должна быть понятная причина».

Счёт — это **класс**: экран баланса, экран истории и банк работают с одним и тем же объектом, а не с копиями.

### Что пригодится
- **Класс** — ссылочный тип. Две константы могут указывать на один объект, а `===` проверяет, один ли это объект. Методы класса меняют свойства без `mutating`.
- **Типизированные ошибки:** `throws(BankError)`, `throw .invalidAmount`, а в `do`/`catch` ошибка сразу имеет тип `BankError`.
- **`Result<Success, Failure>`** — результат-конверт: `.success(значение)` или `.failure(ошибка)`. Его разбирают через `switch`.
- **Перечисление со связанными значениями** и `switch` с `let` внутри `case`.
- **Значение параметра по умолчанию:** `func log(_ text: String, level: Int = 1)`.

Пример на других данных — подарочная карта магазина:

```swift
enum CardError: Error {
    case expired
    case notEnough(missing: Int)
}

final class GiftCard {
    private(set) var balance: Int
    init(balance: Int) { self.balance = balance }

    func pay(_ price: Int) throws(CardError) {
        guard price <= balance else {
            throw .notEnough(missing: price - balance)
        }
        balance -= price
    }
}

func tryToPay(_ price: Int, with card: GiftCard) -> Result<Int, CardError> {
    do {
        try card.pay(price)
        return .success(card.balance)
    } catch {
        return .failure(error)
    }
}

switch tryToPay(700, with: GiftCard(balance: 500)) {
case .success(let left):
    print("Оплачено, осталось \(left)")
case .failure(.notEnough(let missing)):
    print("Не хватает \(missing)")
case .failure(.expired):
    print("Карта просрочена")
}
```

### Задача
Типы `BankError`, `Transaction`, `TransferRequest`, инициализатор `Account` и словарь счетов в `Bank` уже готовы. Допиши всё, что помечено `TODO`.

**Счёт `Account`.** Проверки в обоих методах идут строго по порядку. Если брошена ошибка, баланс и история не меняются.

1. `func deposit(_ amount: Int, as kind: Transaction.Kind = .deposit) throws(BankError)`:
   - `amount` 0 или меньше — `.invalidAmount`;
   - счёт заморожен (`isFrozen`) — `.accountFrozen(number)`;
   - иначе увеличить `balance` и добавить в `history` запись `Transaction` с этим `kind`, суммой и новым балансом.
2. `func withdraw(_ amount: Int, as kind: Transaction.Kind = .withdrawal) throws(BankError)` — те же две проверки, затем: денег меньше, чем `amount`, — `.insufficientFunds(missing:)`, где `missing` — сколько не хватает. Иначе уменьшить `balance` и добавить запись в историю.

**Тексты для экрана**

3. `var statementLine: String` у `Transaction` — строка выписки:
   - `Пополнение: +5000 руб., остаток 5000 руб.`
   - `Снятие: -1200 руб., остаток 3800 руб.`
   - `Перевод от 40817-002: +700 руб., остаток 4500 руб.`
   - `Перевод на 40817-003: -1000 руб., остаток 3500 руб.`
4. `var message: String` у `BankError` — причина отказа:
   - `.invalidAmount` — `сумма должна быть больше нуля`
   - `.accountNotFound(номер)` — `счёт 40817-009 не найден`
   - `.accountFrozen(номер)` — `счёт 40817-002 заморожен`
   - `.insufficientFunds(missing:)` — `не хватает 300 руб.`
   - `.sameAccount` — `нельзя перевести на тот же счёт`

**Банк `Bank`**

5. `func openAccount(number: String, title: String) -> Account` — создаёт счёт, кладёт его в `accounts` и возвращает. Если счёт с таким номером уже есть, возвращает **тот же объект**, новый не создаёт.
6. `func transfer(from: String, to: String, amount: Int) -> Result<Int, BankError>` — перевод между счетами. Проверки по порядку:
   - номера совпадают — `.sameAccount`;
   - нет счёта `from` — `.accountNotFound(from)`, нет счёта `to` — `.accountNotFound(to)`;
   - счёт получателя заморожен — `.accountFrozen(to)`;
   - затем списание с отправителя через `withdraw(_:as:)` с видом `.transferOut(to: to)` — его ошибки возвращаются как есть;
   - зачисление получателю через `deposit(_:as:)` с видом `.transferIn(from: from)`.
   
   При успехе — `.success` с новым балансом **отправителя**.
7. `func runBatch(_ requests: [TransferRequest]) -> [String]` — выполняет переводы по очереди и возвращает по строке на каждый: `Готово: остаток 3500 руб.` (остаток отправителя) или `Отказ: ` и текст `message`.
8. `var totalBalance: Int` — сумма балансов всех счетов банка.

### Пример
```swift
let bank = Bank()
let primary = bank.openAccount(number: "40817-001", title: "Основной счёт Билола")
let savings = bank.openAccount(number: "40817-002", title: "Накопительный")
try primary.deposit(5000)
bank.transfer(from: "40817-001", to: "40817-002", amount: 1500)   // .success(3500)
bank.transfer(from: "40817-001", to: "40817-002", amount: 9000)   // .failure(.insufficientFunds(missing: 5500))
primary.history.last?.statementLine      // "Перевод на 40817-002: -1500 руб., остаток 3500 руб."
savings.balance                       // 1500
bank.totalBalance                     // 5000
```

## @starter
```swift
// Ошибки банковских операций
enum BankError: Error, Equatable {
    case invalidAmount                    // сумма 0 или меньше
    case accountNotFound(String)          // нет счёта с таким номером
    case accountFrozen(String)            // счёт заморожен
    case insufficientFunds(missing: Int)  // сколько рублей не хватает
    case sameAccount                      // перевод на тот же счёт
}

// Запись в истории операций
struct Transaction: Equatable {
    enum Kind: Equatable {
        case deposit                    // пополнение
        case withdrawal                 // снятие
        case transferIn(from: String)   // входящий перевод
        case transferOut(to: String)    // исходящий перевод
    }

    let kind: Kind
    let amount: Int
    let balanceAfter: Int

    // 3. Строка выписки: "Пополнение: +5000 руб., остаток 5000 руб."
    var statementLine: String {
        // TODO
        return ""
    }
}

extension BankError {
    // 4. Причина отказа для экрана: "не хватает 300 руб."
    var message: String {
        // TODO
        return ""
    }
}

// Заявка на перевод из пакета платежей
struct TransferRequest {
    let from: String
    let to: String
    let amount: Int
}

// Счёт. Класс: экраны и банк работают с одним и тем же объектом
final class Account {
    let number: String
    let title: String
    private(set) var balance = 0
    private(set) var history: [Transaction] = []
    var isFrozen = false

    init(number: String, title: String) {
        self.number = number
        self.title = title
    }

    // 1. Положить деньги. kind — как подписать операцию в истории
    func deposit(_ amount: Int, as kind: Transaction.Kind = .deposit) throws(BankError) {
        // TODO
    }

    // 2. Списать деньги
    func withdraw(_ amount: Int, as kind: Transaction.Kind = .withdrawal) throws(BankError) {
        // TODO
    }
}

final class Bank {
    private var accounts: [String: Account] = [:]

    // 5. Открыть счёт. Номер уже занят — вернуть тот же объект
    func openAccount(number: String, title: String) -> Account {
        // TODO
        return Account(number: number, title: title)
    }

    // 6. Перевод. При успехе — новый баланс отправителя
    func transfer(from: String, to: String, amount: Int) -> Result<Int, BankError> {
        // TODO
        return .failure(.sameAccount)
    }

    // 7. Пакет переводов: по строке на каждый
    func runBatch(_ requests: [TransferRequest]) -> [String] {
        // TODO
        return []
    }

    // 8. Сколько денег на всех счетах банка
    var totalBalance: Int {
        // TODO
        return 0
    }
}

// Так приложение пользуется ядром
let bank = Bank()
let primary = bank.openAccount(number: "40817-001", title: "Основной счёт Билола")
let savings = bank.openAccount(number: "40817-002", title: "Накопительный")
let mom = bank.openAccount(number: "40817-003", title: "Счёт мамы")

do {
    try primary.deposit(5000)
    try mom.deposit(2000)
    try primary.withdraw(700)
} catch {
    print("Ошибка: \(error.message)")
}

let payments = [
    TransferRequest(from: "40817-001", to: "40817-002", amount: 1500),
    TransferRequest(from: "40817-003", to: "40817-001", amount: 400),
    TransferRequest(from: "40817-002", to: "40817-002", amount: 100),
    TransferRequest(from: "40817-002", to: "40817-009", amount: 100),
    TransferRequest(from: "40817-001", to: "40817-003", amount: 9000)
]
for line in bank.runBatch(payments) {
    print(line)
}

print("Выписка: \(primary.title)")
for transaction in primary.history {
    print(transaction.statementLine)
}
print("Всего в банке: \(bank.totalBalance) руб.")
```

## @solution
```swift
// Ошибки банковских операций
enum BankError: Error, Equatable {
    case invalidAmount                    // сумма 0 или меньше
    case accountNotFound(String)          // нет счёта с таким номером
    case accountFrozen(String)            // счёт заморожен
    case insufficientFunds(missing: Int)  // сколько рублей не хватает
    case sameAccount                      // перевод на тот же счёт
}

// Запись в истории операций
struct Transaction: Equatable {
    enum Kind: Equatable {
        case deposit                    // пополнение
        case withdrawal                 // снятие
        case transferIn(from: String)   // входящий перевод
        case transferOut(to: String)    // исходящий перевод
    }

    let kind: Kind
    let amount: Int
    let balanceAfter: Int

    // 3. Строка выписки: "Пополнение: +5000 руб., остаток 5000 руб."
    var statementLine: String {
        let tail = "\(amount) руб., остаток \(balanceAfter) руб."
        switch kind {
        case .deposit:
            return "Пополнение: +\(tail)"
        case .withdrawal:
            return "Снятие: -\(tail)"
        case .transferIn(let from):
            return "Перевод от \(from): +\(tail)"
        case .transferOut(let to):
            return "Перевод на \(to): -\(tail)"
        }
    }
}

extension BankError {
    // 4. Причина отказа для экрана: "не хватает 300 руб."
    var message: String {
        switch self {
        case .invalidAmount:
            return "сумма должна быть больше нуля"
        case .accountNotFound(let number):
            return "счёт \(number) не найден"
        case .accountFrozen(let number):
            return "счёт \(number) заморожен"
        case .insufficientFunds(let missing):
            return "не хватает \(missing) руб."
        case .sameAccount:
            return "нельзя перевести на тот же счёт"
        }
    }
}

// Заявка на перевод из пакета платежей
struct TransferRequest {
    let from: String
    let to: String
    let amount: Int
}

// Счёт. Класс: экраны и банк работают с одним и тем же объектом
final class Account {
    let number: String
    let title: String
    private(set) var balance = 0
    private(set) var history: [Transaction] = []
    var isFrozen = false

    init(number: String, title: String) {
        self.number = number
        self.title = title
    }

    // 1. Положить деньги. kind — как подписать операцию в истории
    func deposit(_ amount: Int, as kind: Transaction.Kind = .deposit) throws(BankError) {
        guard amount > 0 else {
            throw .invalidAmount
        }
        guard !isFrozen else {
            throw .accountFrozen(number)
        }
        balance += amount
        history.append(Transaction(kind: kind, amount: amount, balanceAfter: balance))
    }

    // 2. Списать деньги
    func withdraw(_ amount: Int, as kind: Transaction.Kind = .withdrawal) throws(BankError) {
        guard amount > 0 else {
            throw .invalidAmount
        }
        guard !isFrozen else {
            throw .accountFrozen(number)
        }
        guard amount <= balance else {
            throw .insufficientFunds(missing: amount - balance)
        }
        balance -= amount
        history.append(Transaction(kind: kind, amount: amount, balanceAfter: balance))
    }
}

final class Bank {
    private var accounts: [String: Account] = [:]

    // 5. Открыть счёт. Номер уже занят — вернуть тот же объект
    func openAccount(number: String, title: String) -> Account {
        if let existing = accounts[number] {
            return existing
        }
        let account = Account(number: number, title: title)
        accounts[number] = account
        return account
    }

    // 6. Перевод. При успехе — новый баланс отправителя
    func transfer(from: String, to: String, amount: Int) -> Result<Int, BankError> {
        guard from != to else {
            return .failure(.sameAccount)
        }
        guard let sender = accounts[from] else {
            return .failure(.accountNotFound(from))
        }
        guard let receiver = accounts[to] else {
            return .failure(.accountNotFound(to))
        }
        guard !receiver.isFrozen else {
            return .failure(.accountFrozen(to))
        }
        do {
            try sender.withdraw(amount, as: .transferOut(to: to))
            try receiver.deposit(amount, as: .transferIn(from: from))
            return .success(sender.balance)
        } catch {
            return .failure(error)
        }
    }

    // 7. Пакет переводов: по строке на каждый
    func runBatch(_ requests: [TransferRequest]) -> [String] {
        requests.map { request in
            switch transfer(from: request.from, to: request.to, amount: request.amount) {
            case .success(let balance):
                return "Готово: остаток \(balance) руб."
            case .failure(let error):
                return "Отказ: \(error.message)"
            }
        }
    }

    // 8. Сколько денег на всех счетах банка
    var totalBalance: Int {
        accounts.values.reduce(0) { $0 + $1.balance }
    }
}

// Так приложение пользуется ядром
let bank = Bank()
let primary = bank.openAccount(number: "40817-001", title: "Основной счёт Билола")
let savings = bank.openAccount(number: "40817-002", title: "Накопительный")
let mom = bank.openAccount(number: "40817-003", title: "Счёт мамы")

do {
    try primary.deposit(5000)
    try mom.deposit(2000)
    try primary.withdraw(700)
} catch {
    print("Ошибка: \(error.message)")
}

let payments = [
    TransferRequest(from: "40817-001", to: "40817-002", amount: 1500),
    TransferRequest(from: "40817-003", to: "40817-001", amount: 400),
    TransferRequest(from: "40817-002", to: "40817-002", amount: 100),
    TransferRequest(from: "40817-002", to: "40817-009", amount: 100),
    TransferRequest(from: "40817-001", to: "40817-003", amount: 9000)
]
for line in bank.runBatch(payments) {
    print(line)
}

print("Выписка: \(primary.title)")
for transaction in primary.history {
    print(transaction.statementLine)
}
print("Всего в банке: \(bank.totalBalance) руб.")
```

## @tests
```swift
func __t_error(_ body: () throws -> Void) -> BankError? {
    do {
        try body()
        return nil
    } catch let error as BankError {
        return error
    } catch {
        return nil
    }
}
let __t_ok: BankError? = nil

let __t_card = Account(number: "TEST-1", title: "Карта")
__eq("Пополнение на 3000 — без ошибки", __t_error { try __t_card.deposit(3000) }, __t_ok)
__eq("После пополнения баланс 3000", __t_card.balance, 3000, hint: "В deposit увеличь balance на amount")
__eq("Пополнение попало в историю", __t_card.history, [Transaction(kind: .deposit, amount: 3000, balanceAfter: 3000)], hint: "После изменения баланса добавь в history запись Transaction(kind: kind, amount: amount, balanceAfter: balance)")
__eq("Пополнение на 0 — invalidAmount", __t_error { try __t_card.deposit(0) }, .invalidAmount, hint: "Первая проверка: amount должен быть больше нуля")
__eq("Снятие -50 — invalidAmount", __t_error { try __t_card.withdraw(-50) }, .invalidAmount)
__eq("Снятие 1200 — без ошибки, баланс 1800", { _ = __t_error { try __t_card.withdraw(1200) }; return __t_card.balance }(), 1800, hint: "В withdraw уменьши balance на amount")
__eq("Снятие записано как withdrawal с остатком 1800", __t_card.history.last, Transaction(kind: .withdrawal, amount: 1200, balanceAfter: 1800))
__eq("Снять 2000 при балансе 1800 — не хватает 200", __t_error { try __t_card.withdraw(2000) }, .insufficientFunds(missing: 200), hint: "missing — это amount минус balance")
__eq("Неудачные операции не попали в историю и не изменили баланс", "\(__t_card.history.count) / \(__t_card.balance)", "2 / 1800", hint: "Бросай ошибку до того, как менять balance и history")
__eq("Снять ровно весь баланс 1800 — можно", __t_error { try __t_card.withdraw(1800) }, __t_ok, hint: "Если amount равен balance, денег хватает: сравнение <=")
__t_card.isFrozen = true
__eq("Пополнение замороженного счёта — accountFrozen", __t_error { try __t_card.deposit(100) }, .accountFrozen("TEST-1"), hint: "Вторая проверка: если isFrozen, брось .accountFrozen(number)")
__eq("Замороженный счёт и сумма 0 — сначала invalidAmount", __t_error { try __t_card.withdraw(0) }, .invalidAmount, hint: "Проверки идут строго по порядку: сначала сумма, потом заморозка")
__eq("Снятие с замороженного счёта без денег — сначала accountFrozen", __t_error { try __t_card.withdraw(500) }, .accountFrozen("TEST-1"), hint: "Заморозка проверяется раньше, чем баланс")

__eq("Строка выписки: пополнение", Transaction(kind: .deposit, amount: 2500, balanceAfter: 2600).statementLine, "Пополнение: +2500 руб., остаток 2600 руб.")
__eq("Строка выписки: снятие", Transaction(kind: .withdrawal, amount: 300, balanceAfter: 0).statementLine, "Снятие: -300 руб., остаток 0 руб.")
__eq("Строка выписки: входящий перевод", Transaction(kind: .transferIn(from: "X-7"), amount: 150, balanceAfter: 950).statementLine, "Перевод от X-7: +150 руб., остаток 950 руб.", hint: "Номер счёта достань из связанного значения: case .transferIn(let from)")
__eq("Строка выписки: исходящий перевод", Transaction(kind: .transferOut(to: "Y-8"), amount: 90, balanceAfter: 10).statementLine, "Перевод на Y-8: -90 руб., остаток 10 руб.")

__eq("Причины отказа для всех ошибок", [BankError.invalidAmount, .accountNotFound("A-1"), .accountFrozen("B-2"), .insufficientFunds(missing: 75), .sameAccount].map { $0.message }, ["сумма должна быть больше нуля", "счёт A-1 не найден", "счёт B-2 заморожен", "не хватает 75 руб.", "нельзя перевести на тот же счёт"], hint: "Сверь тексты по одному: маленькая буква в начале, номер и сумма — из связанных значений")

let __t_bank = Bank()
let __t_a = __t_bank.openAccount(number: "A", title: "Счёт coffee_lover")
let __t_b = __t_bank.openAccount(number: "B", title: "Счёт night_owl")
let __t_again = __t_bank.openAccount(number: "A", title: "Другое название")
__ok("Повторное открытие номера A возвращает тот же объект", __t_again === __t_a, hint: "Если номер уже есть в accounts, верни найденный счёт, а не новый")
__eq("Название счёта не перезаписывается", __t_again.title, "Счёт coffee_lover")
_ = __t_error { try __t_a.deposit(1000) }
__eq("Перевод 600 из A в B — успех, у отправителя 400", __t_bank.transfer(from: "A", to: "B", amount: 600), .success(400), hint: "При успехе верни .success(sender.balance)")
__eq("Получатель получил 600", __t_b.balance, 600, hint: "После списания зачисли деньги получателю через deposit(_:as:)")
__eq("История отправителя: перевод на B", __t_a.history.last?.kind, .transferOut(to: "B"), hint: "Списывай через withdraw(amount, as: .transferOut(to: to))")
__eq("История получателя: перевод от A", __t_b.history.last?.kind, .transferIn(from: "A"), hint: "Зачисляй через deposit(amount, as: .transferIn(from: from))")
__eq("Перевод на тот же счёт — sameAccount", __t_bank.transfer(from: "A", to: "A", amount: 0), .failure(.sameAccount), hint: "Самая первая проверка — совпадение номеров")
__eq("Нет счёта отправителя", __t_bank.transfer(from: "Z", to: "B", amount: 10), .failure(.accountNotFound("Z")))
__eq("Нет счёта получателя", __t_bank.transfer(from: "A", to: "Q", amount: 10), .failure(.accountNotFound("Q")))
__eq("Не хватает денег: 500 при балансе 400", __t_bank.transfer(from: "A", to: "B", amount: 500), .failure(.insufficientFunds(missing: 100)), hint: "Ошибку из withdraw нужно вернуть как есть: catch { return .failure(error) }")
__t_b.isFrozen = true
__eq("Получатель заморожен — accountFrozen(B)", __t_bank.transfer(from: "A", to: "B", amount: 100), .failure(.accountFrozen("B")))
__eq("После отказов деньги отправителя на месте", __t_a.balance, 400, hint: "Проверь заморозку получателя ДО списания: иначе деньги уйдут со счёта отправителя и никуда не придут")
__t_b.isFrozen = false
__eq("Всего в банке: переводы не меняют сумму", __t_bank.totalBalance, 1000, hint: "Сложи balance всех счетов из accounts.values. Если сумма меньше 1000, деньги потерялись при неудачном переводе")
__eq("Пакет переводов", __t_bank.runBatch([TransferRequest(from: "B", to: "A", amount: 250), TransferRequest(from: "B", to: "A", amount: 900), TransferRequest(from: "A", to: "C", amount: 1)]), ["Готово: остаток 350 руб.", "Отказ: не хватает 550 руб.", "Отказ: счёт C не найден"], hint: "Для каждой заявки вызови transfer и разбери Result через switch: .success(let balance) и .failure(let error)")
__eq("Пустой банк: всего 0", Bank().totalBalance, 0)
```

## @rules
- must: /\bclass\s+Account\b/ :: Счёт должен остаться классом: `final class Account`.

## @hint1
Начни со счёта. В `deposit` и `withdraw` сначала идут `guard`-проверки из задания — каждая бросает свою ошибку. Только когда все проверки пройдены, меняй `balance` и добавляй в `history` запись `Transaction` с переданным `kind`, суммой и уже новым балансом.

Тексты — это два `switch`. В `statementLine` перебери виды операции, а номер счёта достань из связанного значения через `let` прямо в `case`. Общий хвост «сумма, остаток» удобно собрать один раз в константу. В `message` перебери все ошибки.

Банк. `openAccount`: сначала посмотри в словарь — если счёт есть, верни его. `transfer`: четыре `guard` с `return .failure(...)`, потом `do`/`catch`, в котором списание у отправителя и зачисление получателю. Ошибку из `catch` верни как `.failure`. Главное: проверить заморозку получателя нужно до списания, иначе деньги пропадут.

`runBatch` — `map` по заявкам, внутри `switch` по результату `transfer`. `totalBalance` — `reduce` по `accounts.values`.

## @hint2
Связанные значения в `switch` и общий хвост строки:

```swift
let tail = "\(amount) руб., остаток \(balanceAfter) руб."
switch kind {
case .transferIn(let from):
    return "Перевод от \(from): +\(tail)"
// остальные случаи по образцу
}
```

Перевод: сначала все проверки, которые нельзя поручить счетам, потом действия:

```swift
guard !receiver.isFrozen else {
    return .failure(.accountFrozen(to))
}
do {
    try sender.withdraw(amount, as: .transferOut(to: to))
    try receiver.deposit(amount, as: .transferIn(from: from))
    return .success(sender.balance)
} catch {
    return .failure(error)
}
```

## @hint3
Счёт и тексты пишутся по образцам из прошлых подсказок. Заполни пропуски в банке:

```swift
func openAccount(number: String, title: String) -> Account {
    if let existing = accounts[number] {
        return ___
    }
    let account = Account(number: number, title: title)
    accounts[number] = account
    return account
}

func transfer(from: String, to: String, amount: Int) -> Result<Int, BankError> {
    guard from != to else {
        return .failure(.sameAccount)
    }
    guard let sender = accounts[from] else {
        return .failure(.accountNotFound(from))
    }
    guard let receiver = accounts[to] else {
        return .failure(___)
    }
    guard !receiver.isFrozen else {
        return .failure(.accountFrozen(to))
    }
    do {
        try sender.withdraw(amount, as: .transferOut(to: to))
        try receiver.deposit(amount, as: .transferIn(from: from))
        return .success(sender.balance)
    } catch {
        return .failure(error)
    }
}

func runBatch(_ requests: [TransferRequest]) -> [String] {
    requests.map { request in
        switch transfer(from: request.from, to: request.to, amount: request.amount) {
        case .success(let balance):
            return "Готово: остаток \(balance) руб."
        case .failure(let error):
            return ___
        }
    }
}
```

В первом пропуске — найденный счёт. Во втором — ошибка про отсутствующий счёт получателя. В третьем — строка отказа с текстом из `error.message`.

## @hint4
Вот готовое решение:

{{solution}}

**Почему счёт — класс.** В приложении один и тот же счёт видят сразу несколько мест: банк, экран баланса, экран истории. Если бы `Account` был структурой, каждое место получило бы свою копию, и перевод, сделанный через банк, не отразился бы на экране. С классом все держат ссылку на один объект. Поэтому `openAccount` для занятого номера возвращает тот же объект — проверка сравнивает их через `===`.

**Почему сначала проверки, потом изменения.** Каждый `guard` бросает ошибку до того, как тронуты `balance` и `history`. Так ошибка никогда не оставляет счёт «наполовину изменённым».

**Почему заморозка получателя проверяется в банке.** Списание и зачисление — два отдельных шага. Если бы зачисление упало после успешного списания, деньги исчезли бы. Поэтому банк заранее проверяет всё, что может помешать зачислению, и только потом списывает. После этого `deposit` уже не может бросить ошибку.

**Зачем `Result`.** Пакету платежей нужно не прерываться на первой ошибке, а получить ответ по каждой заявке. `Result` превращает «успех или ошибку» в обычное значение, которое удобно сложить в массив и разобрать через `switch`. Благодаря `throws(BankError)` ошибка в `catch` уже имеет нужный тип, и её можно сразу положить в `.failure`.

**Типичные ошибки:**

- в историю записывается старый баланс — запись нужно добавлять после изменения `balance`;
- в `transfer` сначала списание, а заморозка получателя проверяется потом — отправитель теряет деньги;
- в `withdraw` сравнение `<` вместо `<=` — нельзя снять весь остаток до копейки;
- в `.success` возвращается баланс получателя, а по условию нужен баланс отправителя.
