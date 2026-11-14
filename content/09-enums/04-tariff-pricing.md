---
title: Цена тарифа
concept: Вычисляемые свойства и методы в перечислении, switch self
---

## @description

### Контекст
В проекте накопились функции про тарифы: `title(for:)`, `baseFare(for:)`, `pricePerKm(for:)`. Лежат они в разных файлах. Новый разработчик не нашёл готовую функцию и написал свою — с другой ценой километра. Неделю экран выбора тарифа и чек показывали разные суммы.

Тимлид решил навести порядок: «Всё, что относится к тарифу, должно жить внутри тарифа. Тогда ничего не нужно искать: ставишь точку после значения и видишь всё, что оно умеет».

Коллега уже перенёс в перечисление название тарифа. Остальное — твоя задача.

### Новое в Swift
Перечисление — полноценный тип. Как и у структуры, у него могут быть **вычисляемые свойства** и **методы**. Объявляются они внутри фигурных скобок перечисления, после вариантов.

```swift
enum DriverLevel {
    case bronze
    case silver
    case gold

    // Вычисляемое свойство: комиссия сервиса в процентах
    var commissionPercent: Int {
        switch self {
        case .bronze:
            return 25
        case .silver:
            return 20
        case .gold:
            return 15
        }
    }

    // Метод: сколько водитель получит за поездку
    func payout(for ridePrice: Int) -> Int {
        ridePrice - ridePrice * commissionPercent / 100
    }
}

let level = DriverLevel.silver
print(level.commissionPercent)      // 20
print(level.payout(for: 500))       // 400
```

Главное новое слово здесь — `self`. Внутри свойства или метода оно означает «то самое значение, у которого сейчас спросили». В строке `level.commissionPercent` значение `level` равно `.silver`, поэтому внутри свойства `self` — это `.silver`, и `switch self` выбирает вторую ветку.

Обрати внимание на метод `payout(for:)`. Он использует `commissionPercent` просто по имени, без точки. Внутри типа свои свойства и методы видны напрямую.

Сравни две записи:

```swift
commissionPercent(for: level)   // отдельная функция: её ещё нужно найти
level.commissionPercent         // свойство: оно всегда рядом со значением
```

Вторая короче, и такую функцию невозможно потерять в другом файле.

> ⚠️ Хранимых свойств у перечисления быть не может. Строка `var rating = 5` внутри `enum` — ошибка. Разрешены только вычисляемые свойства и методы. Свои данные вариант хранит в сырых или связанных значениях.

### Задача
В редакторе есть перечисление `Tariff` с тремя вариантами и готовым свойством `title`. Допиши внутри перечисления:

1. Вычисляемое свойство `baseFare` типа `Int` — стоимость подачи машины: `100` для эконома, `150` для комфорта, `300` для бизнеса.
2. Вычисляемое свойство `pricePerKm` типа `Int` — цена одного километра: `20` для эконома, `30` для комфорта, `50` для бизнеса.
3. Метод `price(distanceKm:)`. Он принимает расстояние в километрах типа `Int` и возвращает `Int` — цену поездки: подача плюс цена километра, умноженная на расстояние.

В свойствах разбирай варианты через `switch self` без `default`.

### Пример
```swift
Tariff.economy.baseFare                 // 100
Tariff.business.pricePerKm              // 50
Tariff.economy.price(distanceKm: 0)     // 100
Tariff.comfort.price(distanceKm: 12)    // 510
```

Проба в конце кода напечатает:

```text
Комфорт: 510 руб.
```

## @starter
```swift
// Тариф поездки
enum Tariff {
    case economy
    case comfort
    case business

    // Название тарифа для экрана. Это свойство уже перенёс коллега
    var title: String {
        switch self {
        case .economy:
            return "Эконом"
        case .comfort:
            return "Комфорт"
        case .business:
            return "Бизнес"
        }
    }

    // 1. Вычисляемое свойство baseFare - стоимость подачи: 100, 150, 300


    // 2. Вычисляемое свойство pricePerKm - цена километра: 20, 30, 50


    // 3. Метод price(distanceKm:) - подача плюс цена километра на расстояние

}

// Проба: цена поездки на 12 км в тарифе Комфорт
let tariff = Tariff.comfort
print("\(tariff.title): \(tariff.price(distanceKm: 12)) руб.")
```

## @solution
```swift
// Тариф поездки
enum Tariff {
    case economy
    case comfort
    case business

    // Название тарифа для экрана. Это свойство уже перенёс коллега
    var title: String {
        switch self {
        case .economy:
            return "Эконом"
        case .comfort:
            return "Комфорт"
        case .business:
            return "Бизнес"
        }
    }

    // 1. Вычисляемое свойство baseFare - стоимость подачи: 100, 150, 300
    var baseFare: Int {
        switch self {
        case .economy:
            return 100
        case .comfort:
            return 150
        case .business:
            return 300
        }
    }

    // 2. Вычисляемое свойство pricePerKm - цена километра: 20, 30, 50
    var pricePerKm: Int {
        switch self {
        case .economy:
            return 20
        case .comfort:
            return 30
        case .business:
            return 50
        }
    }

    // 3. Метод price(distanceKm:) - подача плюс цена километра на расстояние
    func price(distanceKm: Int) -> Int {
        baseFare + pricePerKm * distanceKm
    }
}

// Проба: цена поездки на 12 км в тарифе Комфорт
let tariff = Tariff.comfort
print("\(tariff.title): \(tariff.price(distanceKm: 12)) руб.")
```

## @tests
```swift
__eq("Название тарифа осталось на месте", Tariff.comfort.title, "Комфорт", hint: "Готовое свойство title менять не нужно")
__eq("Подача в тарифе Эконом: 100 руб.", Tariff.economy.baseFare, 100, hint: "Проверь число в ветке .economy свойства baseFare. И убедись, что свойство разбирает именно self: switch self")
__eq("Подача в тарифе Комфорт: 150 руб.", Tariff.comfort.baseFare, 150, hint: "Проверь число в ветке .comfort свойства baseFare")
__eq("Подача в тарифе Бизнес: 300 руб.", Tariff.business.baseFare, 300, hint: "Проверь число в ветке .business свойства baseFare. И убедись, что свойство разбирает именно self: switch self")
__eq("Километр в тарифе Эконом: 20 руб.", Tariff.economy.pricePerKm, 20, hint: "Проверь число в ветке .economy свойства pricePerKm. И убедись, что свойство разбирает именно self: switch self")
__eq("Километр в тарифе Комфорт: 30 руб.", Tariff.comfort.pricePerKm, 30, hint: "Проверь число в ветке .comfort свойства pricePerKm")
__eq("Километр в тарифе Бизнес: 50 руб.", Tariff.business.pricePerKm, 50, hint: "Проверь число в ветке .business свойства pricePerKm. И убедись, что свойство разбирает именно self: switch self")
__eq("Эконом, 0 км: платим только за подачу", Tariff.economy.price(distanceKm: 0), 100, hint: "При нулевом расстоянии цена равна подаче. Подачу нужно прибавлять, а не умножать на километры")
__eq("Эконом, 1 км", Tariff.economy.price(distanceKm: 1), 120, hint: "Цена: baseFare + pricePerKm * distanceKm")
__eq("Эконом, 10 км", Tariff.economy.price(distanceKm: 10), 300, hint: "Цена: baseFare + pricePerKm * distanceKm")
__eq("Комфорт, 0 км: платим только за подачу", Tariff.comfort.price(distanceKm: 0), 150, hint: "Подача зависит от тарифа: используй свойство baseFare, а не число")
__eq("Комфорт, 12 км", Tariff.comfort.price(distanceKm: 12), 510, hint: "Цена: baseFare + pricePerKm * distanceKm")
__eq("Бизнес, 7 км", Tariff.business.price(distanceKm: 7), 650, hint: "Цена километра зависит от тарифа: используй свойство pricePerKm, а не число")
__eq("Бизнес, 25 км", Tariff.business.price(distanceKm: 25), 1550, hint: "Цена: baseFare + pricePerKm * distanceKm")
```

## @rules
- must: /\bvar\s+baseFare\s*:\s*Int\s*\{/ :: `baseFare` должно быть вычисляемым свойством внутри `Tariff`: `var baseFare: Int { ... }`.
- must: /\bvar\s+pricePerKm\s*:\s*Int\s*\{/ :: `pricePerKm` должно быть вычисляемым свойством внутри `Tariff`: `var pricePerKm: Int { ... }`.
- mustnot: /\bdefault\s*:/ :: В `switch self` перечисли все три тарифа без `default` — тогда Swift проверит, что ни один не забыт.

## @hint1
Всё новое пишется внутри фигурных скобок `Tariff` — там, где стоят комментарии с номерами. Закрывающая скобка перечисления должна остаться после твоего кода.

Образец уже перед глазами: готовое свойство `title`. Свойство `baseFare` устроено точно так же. Сначала слово `var`, имя, двоеточие и тип `Int`, потом фигурные скобки. Внутри — `switch self` с тремя ветками, и каждая возвращает своё число. Знака `=` после типа нет: свойство ничего не хранит, а вычисляет ответ при каждом обращении.

Свойство `pricePerKm` — ещё один такой же блок с другими числами.

Метод `price(distanceKm:)` объявляется словом `func`, как обычная функция, только внутри перечисления. В нём `switch` уже не нужен: подача и цена километра для текущего тарифа лежат в свойствах `baseFare` и `pricePerKm`. К ним можно обращаться просто по имени. Остаётся сложить подачу с произведением цены километра на расстояние.

## @hint2
Вот перечисление со свойством и методом — на примере уровня водителя:

```swift
enum DriverLevel {
    case bronze
    case silver
    case gold

    var commissionPercent: Int {
        switch self {
        case .bronze:
            return 25
        case .silver:
            return 20
        case .gold:
            return 15
        }
    }

    func payout(for ridePrice: Int) -> Int {
        ridePrice - ridePrice * commissionPercent / 100
    }
}
```

Свойство разбирает `self` через `switch`. Метод принимает параметр и пользуется свойством по имени.

## @hint3
Свойство `baseFare` готово. Допиши `pricePerKm` и формулу в методе:

```swift
    var baseFare: Int {
        switch self {
        case .economy:
            return 100
        case .comfort:
            return 150
        case .business:
            return 300
        }
    }

    var pricePerKm: Int {
        switch ___ {
        case .economy:
            return 20
        // ещё две ветки: .comfort и .business
        }
    }

    func price(distanceKm: Int) -> Int {
        ___ + ___ * distanceKm
    }
```

В первом пропуске — слово, которое означает «текущее значение». Во втором и третьем — имена свойств: что прибавляется один раз и что умножается на километры.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Свойства `baseFare` и `pricePerKm` объявлены внутри `Tariff`, поэтому у каждого значения тарифа они есть: `Tariff.comfort.baseFare`. Когда ты пишешь `tariff.baseFare`, Swift выполняет код свойства, а `self` внутри него — это значение `tariff`. `switch self` находит нужную ветку и возвращает число.

Метод `price(distanceKm:)` сам ничего не разбирает. Он берёт `baseFare` и `pricePerKm` — это обращения к свойствам того же значения, полная запись была бы `self.baseFare`. Для `.comfort` и 12 км получается `150 + 30 * 12`, то есть 510. Умножение выполняется раньше сложения, поэтому скобки не нужны.

**Почему свойства, а не три отдельные функции.** Отдельную функцию `pricePerKm(for:)` нужно знать по имени и найти в проекте. Свойство находится само: после точки редактор покажет всё, что есть у тарифа. И второй такой же функции с другими ценами уже никто не напишет — видно, что место занято.

**Почему `price` — метод, а `baseFare` — свойство.** Ориентир тот же, что у структур. Подача — характеристика тарифа, параметры ей не нужны: это свойство. Цена поездки зависит от расстояния, нужен параметр: это метод.

**Почему в методе нет `switch`.** Можно было бы в каждой ветке написать свою формулу: `100 + 20 * distanceKm` и так далее. Но тогда цены жили бы в двух местах, и при смене тарифов их пришлось бы править дважды. Сейчас каждое число записано один раз.

**Типичные ошибки:**

- после типа свойства поставлен знак `=`: `var baseFare: Int = 100` — это хранимое свойство, а в перечислении их быть не может;
- код написан после закрывающей скобки `Tariff` — тогда `self` там не существует, а у тарифа свойство не появляется;
- в формуле подача тоже умножена на расстояние: `(baseFare + pricePerKm) * distanceKm` — тогда поездка на 0 км стоит 0;
- `switch tariff` вместо `switch self` — такой код соберётся, но будет каждый раз смотреть на константу `tariff` из пробы внизу. У всех тарифов окажутся цены Комфорта.
