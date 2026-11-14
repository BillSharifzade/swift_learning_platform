---
title: Выбор тарифа
concept: CaseIterable и список всех вариантов allCases
---

## @description

### Контекст
На экране выбора тарифа пассажир видит список: название тарифа и цена поездки по его маршруту. Список тарифов для этого экрана когда-то написали вручную: `[.economy, .comfort, .business]`.

Месяц назад в приложении появился тариф «Детский». В перечисление его добавили, а в этот массив — забыли. Менеджер продукта пишет в рабочий чат: «Мы запустили рекламу детского тарифа, а выбрать его в приложении нельзя!»

Тимлид просит исправить не только список, но и причину: «Массив, который нужно поддерживать руками, рано или поздно разойдётся с перечислением. Пусть список тарифов составляет сам Swift».

### Новое в Swift
Перечисление умеет само выдать список всех своих вариантов. Эта способность называется `CaseIterable` (от слов case — вариант и iterable — «то, что можно перебрать»). Включается она так же, как сырые значения в задаче про оплату: после имени перечисления ставят двоеточие и пишут её название.

```swift
enum RideOption: CaseIterable {
    case childSeat
    case petFriendly
    case quietRide

    var title: String {
        switch self {
        case .childSeat:
            return "Детское кресло"
        case .petFriendly:
            return "Поездка с питомцем"
        case .quietRide:
            return "Тихая поездка"
        }
    }
}
```

После этого у типа появляется свойство `allCases` — обычный массив со всеми вариантами:

```swift
print(RideOption.allCases.count)    // 3

for option in RideOption.allCases {
    print(option.title)
}
```

```text
Детское кресло
Поездка с питомцем
Тихая поездка
```

Что здесь важно:

- `allCases` принадлежит самому типу, а не отдельному значению. Поэтому пишут `RideOption.allCases` — через имя типа, как у статических свойств структур;
- варианты идут в том порядке, в каком они объявлены;
- массив собирает Swift. Добавишь четвёртый `case` — он появится в `allCases` сам, ничего дописывать не нужно;
- без `CaseIterable` свойства `allCases` нет. Если забыть его включить, Swift сообщит, что у типа нет `allCases`.

Способностей может быть несколько, тогда их пишут через запятую: `enum Theme: String, CaseIterable`. Что именно означает запись после двоеточия, ты узнаешь в модуле про протоколы. Пока достаточно понимать её как просьбу к Swift: «добавь моему типу готовое умение».

> ⚠️ Сам собой `CaseIterable` работает только у перечислений без связанных значений. Перечислить все возможные имена водителей или все цены Swift не может.

### Задача
В редакторе есть перечисление `Tariff` — теперь с четырьмя тарифами, свойствами и методом `price(distanceKm:)`.

1. Добавь перечислению `Tariff` способность `CaseIterable`.
2. Допиши функцию `tariffOptions(distanceKm:)`. Она возвращает массив строк — по одной на каждый тариф, в порядке объявления. Строка состоит из названия тарифа, двоеточия, пробела, цены поездки и слова `руб.` — например `Эконом: 300 руб.`
3. Допиши функцию `affordableTariffs(distanceKm:budget:)`. Она возвращает массив `[Tariff]` — тарифы, поездка по которым стоит не больше `budget`. Порядок — как в объявлении. Если не подходит ни один тариф, массив пустой.

Тарифы не перечисляй вручную: в обеих функциях проходи циклом по `Tariff.allCases`.

### Пример
```swift
tariffOptions(distanceKm: 10)
// ["Эконом: 300 руб.", "Комфорт: 450 руб.", "Бизнес: 800 руб.", "Детский: 550 руб."]

affordableTariffs(distanceKm: 10, budget: 550)   // [.economy, .comfort, .kids]
affordableTariffs(distanceKm: 10, budget: 250)   // []
```

Проба в конце кода напечатает:

```text
Выбор тарифа (10 км):
Эконом: 300 руб.
Комфорт: 450 руб.
Бизнес: 800 руб.
Детский: 550 руб.
```

## @starter
```swift
// Тариф поездки.
// 1. Добавь перечислению способность CaseIterable
enum Tariff {
    case economy
    case comfort
    case business
    case kids

    var title: String {
        switch self {
        case .economy: return "Эконом"
        case .comfort: return "Комфорт"
        case .business: return "Бизнес"
        case .kids: return "Детский"
        }
    }

    var baseFare: Int {
        switch self {
        case .economy: return 100
        case .comfort: return 150
        case .business: return 300
        case .kids: return 200
        }
    }

    var pricePerKm: Int {
        switch self {
        case .economy: return 20
        case .comfort: return 30
        case .business: return 50
        case .kids: return 35
        }
    }

    func price(distanceKm: Int) -> Int {
        baseFare + pricePerKm * distanceKm
    }
}

// 2. Строки для экрана выбора тарифа: "Эконом: 300 руб." - по одной на каждый тариф
func tariffOptions(distanceKm: Int) -> [String] {
    // Замени заглушку: пройди циклом по Tariff.allCases и собери строки
    return []
}

// 3. Тарифы, на которые хватает бюджета пассажира
func affordableTariffs(distanceKm: Int, budget: Int) -> [Tariff] {
    // Замени заглушку: пройди циклом по Tariff.allCases и оставь подходящие
    return []
}

// Проба: экран выбора тарифа для поездки на 10 км
print("Выбор тарифа (10 км):")
for option in tariffOptions(distanceKm: 10) {
    print(option)
}
```

## @solution
```swift
// Тариф поездки.
// 1. Добавь перечислению способность CaseIterable
enum Tariff: CaseIterable {
    case economy
    case comfort
    case business
    case kids

    var title: String {
        switch self {
        case .economy: return "Эконом"
        case .comfort: return "Комфорт"
        case .business: return "Бизнес"
        case .kids: return "Детский"
        }
    }

    var baseFare: Int {
        switch self {
        case .economy: return 100
        case .comfort: return 150
        case .business: return 300
        case .kids: return 200
        }
    }

    var pricePerKm: Int {
        switch self {
        case .economy: return 20
        case .comfort: return 30
        case .business: return 50
        case .kids: return 35
        }
    }

    func price(distanceKm: Int) -> Int {
        baseFare + pricePerKm * distanceKm
    }
}

// 2. Строки для экрана выбора тарифа: "Эконом: 300 руб." - по одной на каждый тариф
func tariffOptions(distanceKm: Int) -> [String] {
    var options: [String] = []
    for tariff in Tariff.allCases {
        options.append("\(tariff.title): \(tariff.price(distanceKm: distanceKm)) руб.")
    }
    return options
}

// 3. Тарифы, на которые хватает бюджета пассажира
func affordableTariffs(distanceKm: Int, budget: Int) -> [Tariff] {
    var affordable: [Tariff] = []
    for tariff in Tariff.allCases {
        if tariff.price(distanceKm: distanceKm) <= budget {
            affordable.append(tariff)
        }
    }
    return affordable
}

// Проба: экран выбора тарифа для поездки на 10 км
print("Выбор тарифа (10 км):")
for option in tariffOptions(distanceKm: 10) {
    print(option)
}
```

## @tests
```swift
let __t_allCount = (Tariff.self as? any CaseIterable.Type)?.allCases.count
if let __t_allCount {
    __eq("Tariff умеет перечислять свои варианты: в allCases четыре тарифа", __t_allCount, 4, hint: "Варианты перечисления менять не нужно: economy, comfort, business, kids")
} else {
    __fail("Tariff умеет перечислять свои варианты: в allCases четыре тарифа", "У Tariff пока нет способности CaseIterable. Допиши её после имени перечисления: enum Tariff: CaseIterable")
}
__eq("Список тарифов для поездки на 10 км", tariffOptions(distanceKm: 10), ["Эконом: 300 руб.", "Комфорт: 450 руб.", "Бизнес: 800 руб.", "Детский: 550 руб."], hint: "Нужна строка для каждого тарифа из Tariff.allCases: название, двоеточие, пробел, цена и руб. с точкой")
__eq("Список тарифов для поездки на 4 км", tariffOptions(distanceKm: 4), ["Эконом: 180 руб.", "Комфорт: 270 руб.", "Бизнес: 500 руб.", "Детский: 340 руб."], hint: "Цену считай методом price(distanceKm:) - расстояние берётся из параметра функции")
__eq("Список тарифов для поездки на 0 км: только подача", tariffOptions(distanceKm: 0), ["Эконом: 100 руб.", "Комфорт: 150 руб.", "Бизнес: 300 руб.", "Детский: 200 руб."], hint: "Цену считай методом price(distanceKm:) - расстояние берётся из параметра функции")
__eq("10 км, бюджет 5000 руб.: подходят все четыре тарифа", affordableTariffs(distanceKm: 10, budget: 5000), [.economy, .comfort, .business, .kids], hint: "Верни все тарифы, цена которых не больше бюджета, в порядке объявления")
__eq("10 км, бюджет 550 руб.: Бизнес дороже, а на Детский хватает ровно", affordableTariffs(distanceKm: 10, budget: 550), [.economy, .comfort, .kids], hint: "Детский стоит ровно 550 руб. - он подходит: сравнивай через <=. А Бизнес за 800 руб. нужно пропустить, хотя он объявлен раньше")
__eq("10 км, бюджет 549 руб.: на Детский уже не хватает", affordableTariffs(distanceKm: 10, budget: 549), [.economy, .comfort], hint: "Детский стоит 550 руб., а бюджет на рубль меньше")
__eq("10 км, бюджет 300 руб.: хватает ровно на Эконом", affordableTariffs(distanceKm: 10, budget: 300), [.economy], hint: "Цена, равная бюджету, подходит: сравнивай через <=")
__eq("10 км, бюджет 250 руб.: не подходит ни один тариф", affordableTariffs(distanceKm: 10, budget: 250), [], hint: "Если ни на один тариф не хватает, верни пустой массив")
__eq("0 км, бюджет 200 руб.: Эконом, Комфорт и Детский", affordableTariffs(distanceKm: 0, budget: 200), [.economy, .comfort, .kids], hint: "Цена зависит от расстояния: считай её методом price(distanceKm:) для каждого тарифа")
```

## @rules
- must: /\benum\s+Tariff\s*:[^{]*\bCaseIterable\b/ :: Добавь перечислению способность `CaseIterable`: `enum Tariff: CaseIterable {`.
- must: /\bTariff\s*\.\s*allCases\b/ :: Список тарифов возьми из `Tariff.allCases` — его собирает сам Swift.
- mustnot: /\[\s*(?:Tariff\s*)?\.\s*economy\s*,/ :: Не перечисляй тарифы вручную в массиве — именно так и потерялся «Детский». Проходи циклом по `Tariff.allCases`.

## @hint1
Первый шаг — одна правка в первой строке перечисления. После имени `Tariff` поставь двоеточие и слово `CaseIterable`. Больше внутри перечисления ничего менять не нужно. Теперь у типа есть свойство `allCases` — массив всех четырёх тарифов в порядке объявления.

В `tariffOptions(distanceKm:)` заведи пустой массив строк через `var`. Затем пройди циклом `for` по `Tariff.allCases`. На каждом шаге в переменной цикла лежит очередной тариф. У него есть название `title` и метод `price(distanceKm:)` — в метод передай расстояние из параметра функции. Собери из них строку через интерполяцию и добавь её в массив методом `append`. После цикла верни массив.

`affordableTariffs(distanceKm:budget:)` устроена похоже, но массив в ней хранит сами тарифы, а не строки. Внутри цикла нужен `if`: тариф добавляется, только если цена поездки не больше бюджета. Цена, равная бюджету, тоже подходит.

Обе заглушки `return []` замени своим кодом.

## @hint2
Вот как включается `CaseIterable` и как по `allCases` собирается массив — на примере пожеланий к поездке:

```swift
enum RideOption: CaseIterable {
    case childSeat
    case petFriendly
    case quietRide
}

func optionCodes() -> [String] {
    var codes: [String] = []
    for option in RideOption.allCases {
        codes.append("Опция: \(option)")
    }
    return codes
}
```

Пустой массив, цикл по `allCases`, `append` на каждом шаге и `return` в конце. Твои функции построены так же.

## @hint3
Первая функция почти готова, во второй не хватает условия:

```swift
enum Tariff: ___ {
    // варианты, свойства и метод остаются как были
}

func tariffOptions(distanceKm: Int) -> [String] {
    var options: [String] = []
    for tariff in Tariff.___ {
        options.append("\(tariff.title): \(tariff.price(distanceKm: distanceKm)) руб.")
    }
    return options
}

func affordableTariffs(distanceKm: Int, budget: Int) -> [Tariff] {
    var affordable: [Tariff] = []
    for tariff in Tariff.allCases {
        if ___ {
            affordable.append(tariff)
        }
    }
    return affordable
}
```

В первом пропуске — название способности. Во втором — свойство со списком всех вариантов. В третьем — условие: цена поездки по этому тарифу не больше бюджета.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Запись `enum Tariff: CaseIterable` просит Swift добавить типу свойство `allCases`. Это обычный массив `[Tariff]`: в нём лежат `.economy`, `.comfort`, `.business` и `.kids` — в том порядке, в каком написаны `case`. Обе функции проходят по нему циклом. `tariffOptions(distanceKm:)` для каждого тарифа собирает строку из названия и цены. `affordableTariffs(distanceKm:budget:)` считает цену и добавляет тариф в результат, только если она не больше бюджета.

**Почему `allCases`, а не свой массив.** Массив `[.economy, .comfort, .business]` был верным в день, когда его написали. Потом перечисление изменилось, а массив остался прежним — и Swift не мог этого заметить: для него это два независимых куска кода. `allCases` строится из самого перечисления, поэтому отстать от него не может. Следующий новый тариф появится на экране без единой правки в этих функциях.

**Почему сравнение через `<=`.** У пассажира 550 рублей, поездка стоит 550. На неё хватает, и тариф должен попасть в список. С оператором `<` он бы потерялся. Такие ошибки «на границе» встречаются очень часто, поэтому проверка специально подбирает бюджет, равный цене.

**Почему `Tariff.allCases`, а не `tariff.allCases`.** Список вариантов — свойство всего типа, а не одного тарифа. У значения `.comfort` нет «своих» вариантов. Поэтому перед точкой стоит имя типа с большой буквы.

**Типичные ошибки:**

- `CaseIterable` не добавлен — Swift сообщает, что у `Tariff` нет `allCases`;
- в строку вставлен `pricePerKm` или `baseFare` вместо вызова `price(distanceKm:)`;
- в `price(distanceKm:)` передано число `10` вместо параметра `distanceKm` — проба совпадёт, а проверка на 4 км нет;
- `return` стоит внутри цикла — функция выходит после первого же тарифа.
