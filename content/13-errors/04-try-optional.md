---
title: Промокод, если получится
concept: try? и try! — ошибка превращается в nil или в падение
---

## @description

### Контекст
В трекере срочный тикет с пометкой «крэш»: «Билол ввёл промокод `winter25` из прошлогодней рассылки, и приложение закрылось прямо на экране оформления заказа».

Виновата функция `priceWithPromo`. Её писали в спешке перед распродажей: промокоды тогда были только действующие, и автор решил, что ошибок не бывает. Сама проверка промокода, `promoDiscount`, написана правильно: для старого, пустого или выдуманного кода она бросает ошибку.

Продакт-менеджер объясняет, как должно быть: «Если промокод не подошёл, заказ просто идёт по полной цене. Ронять приложение нельзя ни в коем случае. Причину отказа на этом экране не показываем — под полем ввода достаточно короткой подписи».

Заодно в задаче ещё две маленькие функции для экрана оформления.

### Новое в Swift
Иногда причина ошибки не важна. Важно только одно: получилось или нет. Писать ради этого целый `do-catch` долго. Для таких случаев есть `try?`.

**`try?` превращает ошибку в `nil`.** Возьмём функцию из первой задачи, которая возвращает дневной лимит по уровню клиента или бросает ошибку для неизвестного уровня:

```swift
let goldLimit = try? dailyLimit(forLevel: 2)     // Optional(300000)
let strangeLimit = try? dailyLimit(forLevel: 7)  // nil
```

Если функция вернула значение, `try?` кладёт его в «коробочку» опционала. Если бросила ошибку — получается `nil`, а сама ошибка отбрасывается. Дальше работают инструменты из «Рядом»:

```swift
// запасное значение через ??
let shownLimit = (try? dailyLimit(forLevel: level)) ?? 50000

// развёртка через if let
if let limit = try? dailyLimit(forLevel: level) {
    print("Ваш лимит: \(limit) руб.")
}

// только удачные результаты из списка
let knownLimits = [1, 2, 7].compactMap { try? dailyLimit(forLevel: $0) }
// [50000, 300000]
```

> ⚠️ Обрати внимание на скобки в первом примере. `try?` действует на **всё**, что стоит справа от него. Без скобок `try? dailyLimit(forLevel: level) ?? 50000` Swift поймёт как «попробуй посчитать `dailyLimit(...) ?? 50000`», и результат останется опционалом. Скобки `(try? ...)` говорят: сначала получи опционал, а потом подставь запасное значение.

**`try!` — «ошибки точно не будет».** Это родственник принудительной развёртки `!`. Если функция вернула значение, `try!` отдаёт его без всякой коробочки. Если бросила ошибку — **программа падает**:

```swift
let limit = try! dailyLimit(forLevel: 7)
// Fatal error: 'try!' expression unexpectedly raised an error
```

Писать `try!` допустимо, только когда ошибка невозможна в принципе. С данными, которые ввёл человек или прислал сервер, это никогда не так: там рано или поздно встретится что угодно.

> 💡 Как выбрать. Нужна причина ошибки, чтобы показать разный текст — `do-catch`. Достаточно знать «получилось или нет» — `try?`. `try!` — почти никогда.

### Задача
В редакторе есть перечисление `PromoError`, справочники `activePromos` и `expiredPromos` и готовая функция `promoDiscount(for:)`. Она возвращает скидку в процентах или бросает ошибку. Не меняй их.

1. Исправь функцию `priceWithPromo(_:code:)`: убери `try!` и используй `try?`. Если промокод не подошёл по любой причине, скидка равна `0`, и функция возвращает цену без изменений. Формулу расчёта цены не меняй.
2. Допиши функцию `promoLabel(for:)`. Она возвращает подпись под полем промокода:
   - если промокод подошёл — `Скидка 15% применена` (вместо `15` — скидка из `promoDiscount`);
   - если нет — `Промокод не подошёл`.
3. Допиши функцию `bestDiscount(from:)`. Она получает массив промокодов, сохранённых в профиле, и возвращает самую большую скидку среди тех, что подошли. Если не подошёл ни один или массив пуст — `0`.

`try!` в твоём коде остаться не должно.

### Пример
```swift
priceWithPromo(2000, code: "spring10")     // 1800
priceWithPromo(2000, code: "winter25")     // 2000 — промокод истёк, но приложение не падает

promoLabel(for: "friend20")                // "Скидка 20% применена"
promoLabel(for: "")                        // "Промокод не подошёл"

bestDiscount(from: ["winter25", "spring10", "friend20", "hello"])   // 20
bestDiscount(from: [])                                              // 0
```

## @starter
```swift
// Почему промокод не подошёл
enum PromoError: Error {
    case empty
    case expired
    case unknown
}

// Действующие промокоды и скидка по ним в процентах
let activePromos = ["SPRING10": 10, "MONETA15": 15, "FRIEND20": 20]
// Промокоды, у которых закончился срок
let expiredPromos: Set<String> = ["WINTER25", "BLACKFRIDAY"]

// Проверяет промокод и возвращает скидку в процентах (код готов, его не меняй)
func promoDiscount(for code: String) throws -> Int {
    let normalized = code.uppercased()
    guard !normalized.isEmpty else {
        throw PromoError.empty
    }
    guard !expiredPromos.contains(normalized) else {
        throw PromoError.expired
    }
    guard let percent = activePromos[normalized] else {
        throw PromoError.unknown
    }
    return percent
}

// 1. Цена со скидкой по промокоду.
//    Из-за этой функции приложение падает — исправь её
func priceWithPromo(_ price: Int, code: String) -> Int {
    let percent = try! promoDiscount(for: code)
    return price - price * percent / 100
}

// 2. Подпись под полем ввода промокода
func promoLabel(for code: String) -> String {
    return ""
}

// 3. Лучшая скидка среди промокодов из профиля
func bestDiscount(from codes: [String]) -> Int {
    return 0
}

// Билол ввёл промокод из прошлогодней рассылки
print(priceWithPromo(2000, code: "winter25"))
print(promoLabel(for: "winter25"))
```

## @solution
```swift
// Почему промокод не подошёл
enum PromoError: Error {
    case empty
    case expired
    case unknown
}

// Действующие промокоды и скидка по ним в процентах
let activePromos = ["SPRING10": 10, "MONETA15": 15, "FRIEND20": 20]
// Промокоды, у которых закончился срок
let expiredPromos: Set<String> = ["WINTER25", "BLACKFRIDAY"]

// Проверяет промокод и возвращает скидку в процентах (код готов, его не меняй)
func promoDiscount(for code: String) throws -> Int {
    let normalized = code.uppercased()
    guard !normalized.isEmpty else {
        throw PromoError.empty
    }
    guard !expiredPromos.contains(normalized) else {
        throw PromoError.expired
    }
    guard let percent = activePromos[normalized] else {
        throw PromoError.unknown
    }
    return percent
}

// 1. Цена со скидкой по промокоду.
//    Из-за этой функции приложение падает — исправь её
func priceWithPromo(_ price: Int, code: String) -> Int {
    let percent = (try? promoDiscount(for: code)) ?? 0
    return price - price * percent / 100
}

// 2. Подпись под полем ввода промокода
func promoLabel(for code: String) -> String {
    if let percent = try? promoDiscount(for: code) {
        return "Скидка \(percent)% применена"
    }
    return "Промокод не подошёл"
}

// 3. Лучшая скидка среди промокодов из профиля
func bestDiscount(from codes: [String]) -> Int {
    let discounts = codes.compactMap { try? promoDiscount(for: $0) }
    return discounts.max() ?? 0
}

// Билол ввёл промокод из прошлогодней рассылки
print(priceWithPromo(2000, code: "winter25"))
print(promoLabel(for: "winter25"))
```

## @tests
```swift
__eq("Цена: 2000 руб. с промокодом spring10", priceWithPromo(2000, code: "spring10"), 1800, hint: "Для действующего промокода скидка берётся из promoDiscount")
__eq("Цена: 3000 руб. с промокодом MONETA15", priceWithPromo(3000, code: "MONETA15"), 2550)
__eq("Цена: истёкший промокод winter25 — полная цена", priceWithPromo(2000, code: "winter25"), 2000, hint: "Если промокод не подошёл, скидка 0: (try? ...) ?? 0")
__eq("Цена: пустой промокод — полная цена", priceWithPromo(4990, code: ""), 4990)
__eq("Цена: несуществующий промокод — полная цена", priceWithPromo(1500, code: "SALE99"), 1500)

__eq("Подпись: friend20", promoLabel(for: "friend20"), "Скидка 20% применена", hint: "Процент нужно взять из результата promoDiscount")
__eq("Подпись: SPRING10", promoLabel(for: "SPRING10"), "Скидка 10% применена")
__eq("Подпись: истёкший BLACKFRIDAY", promoLabel(for: "BLACKFRIDAY"), "Промокод не подошёл")
__eq("Подпись: пустое поле", promoLabel(for: ""), "Промокод не подошёл")
__eq("Подпись: выдуманный промокод", promoLabel(for: "hello"), "Промокод не подошёл")

__eq("Лучшая скидка: из четырёх кодов подошли 10% и 20%", bestDiscount(from: ["winter25", "spring10", "friend20", "hello"]), 20, hint: "Собери скидки тех кодов, что подошли (compactMap и try?), и возьми наибольшую")
__eq("Лучшая скидка: один код moneta15", bestDiscount(from: ["moneta15"]), 15)
__eq("Лучшая скидка: самая большая стоит первой", bestDiscount(from: ["FRIEND20", "MONETA15", "spring10"]), 20, hint: "Нужна самая большая скидка, а не первая или последняя")
__eq("Лучшая скидка: пустой список", bestDiscount(from: []), 0, hint: "Если скидок нет, max() вернёт nil — подставь 0")
__eq("Лучшая скидка: ни один код не подошёл", bestDiscount(from: ["", "BLACKFRIDAY", "hello"]), 0)
```

## @rules
- mustnot: /\btry\s*!/ :: В коде остался `try!` — он роняет приложение при любой ошибке. Замени его на `try?`.
- must: /\btry\s*\?/ :: Используй `try?`, чтобы превратить ошибку в `nil`.

## @hint1
Начни с `priceWithPromo`. Замени `try!` на `try?`. Теперь результат вызова — опционал: скидка или `nil`. Чтобы получить обычное число, подставь запасное значение `0` оператором из двух вопросительных знаков. Помни о скобках: выражение с `try?` нужно взять в круглые скобки целиком, а запасное значение поставить уже после них.

В `promoLabel` подойдёт `if let`: справа от знака равенства — вызов `promoDiscount` с `try?`. Если значение достать удалось, верни текст со скидкой. Иначе — текст о том, что промокод не подошёл.

В `bestDiscount` пройди по массиву методом `compactMap`: внутри замыкания вызови `promoDiscount` с `try?`. Получится массив скидок только тех кодов, что подошли. Наибольший элемент даёт метод `max()`. Он возвращает опционал: для пустого массива — `nil`. Значит, снова нужен запасной `0`.

## @hint2
Три приёма с `try?` — на примере дневного лимита:

```swift
let shownLimit = (try? dailyLimit(forLevel: level)) ?? 50000

if let limit = try? dailyLimit(forLevel: level) {
    print("Ваш лимит: \(limit) руб.")
}

let knownLimits = [1, 2, 7].compactMap { try? dailyLimit(forLevel: $0) }
```

В каждой твоей функции пригодится один из них.

## @hint3
Осталось заполнить пропуски:

```swift
func priceWithPromo(_ price: Int, code: String) -> Int {
    let percent = (___ promoDiscount(for: code)) ?? ___
    return price - price * percent / 100
}

func promoLabel(for code: String) -> String {
    if let percent = try? promoDiscount(for: code) {
        return "Скидка \(percent)% применена"
    }
    return "Промокод не подошёл"
}

func bestDiscount(from codes: [String]) -> Int {
    let discounts = codes.___ { try? promoDiscount(for: $0) }
    return discounts.max() ?? 0
}
```

В первом пропуске — `try` с нужным знаком. Во втором — скидка, если промокод не подошёл. В третьем — метод, который собирает только не-`nil` результаты.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `try?` вызывает функцию и упаковывает исход в опционал: удача — значение в коробочке, ошибка — `nil`. Дальше всё как в «Рядом»:

- в `priceWithPromo` оператор `??` подставляет `0`, если промокод не подошёл, и формула возвращает полную цену;
- в `promoLabel` `if let` разворачивает скидку и сразу вставляет её в текст;
- в `bestDiscount` `compactMap` выбрасывает все `nil`. Из `["winter25", "spring10", "friend20", "hello"]` получается `[10, 20]`, и `max()` выбирает `20`.

**Почему не `try!`.** `try!` — обещание «ошибки не будет». Промокод вводит человек, и он может ввести что угодно: опечатку, старый код, пустую строку. Каждый такой случай раньше ронял приложение. Это та же история, что с `!` у опционалов: падение в руках у покупателя хуже любого сообщения об ошибке.

**Почему здесь `try?`, а не `do-catch`.** Экрану цены неважно, почему промокод не подошёл: истёк он или выдуман, результат один — полная цена. `try?` записывает это в одну строку. Там, где причина важна, нужен `do-catch` — как в прошлых задачах.

**Типичные ошибки:**

- `try? promoDiscount(for: code) ?? 0` без скобок — `percent` остаётся опционалом, и формула не соберётся;
- в `bestDiscount` берётся первая подошедшая скидка, а не наибольшая;
- забыт запасной `0` после `max()` — для пустого списка результат был бы `nil`.
