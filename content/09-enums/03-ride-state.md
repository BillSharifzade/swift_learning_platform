---
title: Состояние поездки
concept: Связанные значения перечисления (associated values)
---

## @description

### Контекст
Во время поездки главный экран показывает одно из состояний: ищем машину, водитель назначен, поездка идёт, завершена или отменена. У каждого состояния свои данные. У «водитель назначен» — имя водителя и время подачи. У «завершена» — цена.

Сейчас всё это лежит в структуре с опциональными полями: `driverName: String?`, `arrivalMinutes: Int?`, `price: Int?`. Приходится помнить, какое поле в каком состоянии заполнено. Тестировщик прислал снимок экрана: поездка уже завершена, а на экране надпись «Водитель nil приедет через nil мин.».

Тимлид предлагает: «Пусть данные лежат прямо внутри состояния. Тогда у завершённой поездки просто не будет имени водителя — и перепутать станет нечего».

### Новое в Swift
Вариант перечисления может нести с собой данные. Они называются **связанными значениями** (по-английски associated values). В объявлении их пишут в круглых скобках после имени варианта — как параметры функции: имя, двоеточие, тип.

```swift
enum Destination {
    case home
    case address(street: String, house: Int)
    case airport(terminal: String)
}
```

У `home` данных нет. У `address` их два: улица и номер дома. У `airport` — одно: терминал.

**Создание значения.** Данные передают в скобках, с метками — как при вызове функции:

```swift
let first = Destination.home
let second = Destination.address(street: "Садовая", house: 12)
let third: Destination = .airport(terminal: "B")
```

**Как достать данные.** В ветке `switch` после варианта пишут скобки, а в них — `let` и имя для каждого значения:

```swift
func describe(_ destination: Destination) -> String {
    switch destination {
    case .home:
        return "Домой"
    case .address(let street, let house):
        return "\(street), дом \(house)"
    case .airport(let terminal):
        return "Аэропорт, терминал \(terminal)"
    }
}

print(describe(second))   // Садовая, дом 12
```

Запись `let street` означает: «достань значение и назови его `street`». Получается обычная константа, но живёт она только внутри своей ветки. Значения идут в том же порядке, что в объявлении. В ветке `.home` доставать нечего — там скобок нет.

**Чем это отличается от сырых значений.** Сырое значение задано один раз в объявлении и одинаково для всех: у каждого `.dark` это `"dark"`. Связанные значения задаются при создании и каждый раз свои: одна поездка на Садовую, 12, другая — на Лесную, 3. В одном перечислении используют что-то одно: либо сырые значения, либо связанные.

> ⚠️ Значения перечисления со связанными значениями пока нельзя сравнивать через `==`: Swift не знает, как сравнивать данные внутри. Разбирай их через `switch`. Научить Swift такому сравнению можно — это тема модуля про протоколы.

### Задача
1. Объяви перечисление `RideState` с пятью вариантами:
   - `searching` — без данных;
   - `driverAssigned` — два значения: `name` типа `String` и `minutes` типа `Int`;
   - `inProgress` — одно значение: `minutesLeft` типа `Int`;
   - `finished` — одно значение: `price` типа `Int`;
   - `cancelled` — одно значение: `reason` типа `String`.
2. Допиши функцию `statusText(for:)`. Она принимает `RideState` и возвращает текст для экрана:
   - `searching` — `Ищем машину`;
   - `driverAssigned` — `Водитель Билол приедет через 4 мин.`;
   - `inProgress` — `В пути. Осталось 12 мин.`;
   - `finished` — `Поездка завершена. К оплате: 540 руб.`;
   - `cancelled` — `Поездка отменена: водитель не приехал`.

   Имя, минуты, цена и причина берутся из данных варианта. Разбирай состояние через `switch` без `default`.
3. Создай константу `currentState`: назначен водитель `Билол`, приедет через `6` минут.

### Пример
```swift
statusText(for: .searching)                                // "Ищем машину"
statusText(for: .driverAssigned(name: "Билол", minutes: 4)) // "Водитель Билол приедет через 4 мин."
statusText(for: .finished(price: 540))                     // "Поездка завершена. К оплате: 540 руб."
```

Проба в конце кода напечатает:

```text
Водитель Билол приедет через 6 мин.
```

## @starter
```swift
// 1. Объяви перечисление RideState. Варианты и их данные:
//    searching       - без данных
//    driverAssigned  - name: String, minutes: Int
//    inProgress      - minutesLeft: Int
//    finished        - price: Int
//    cancelled       - reason: String


// 2. Текст для экрана поездки
func statusText(for state: RideState) -> String {
    // Замени заглушку: switch по state, данные доставай через let
    return ""
}

// 3. Создай константу currentState: назначен водитель Билол, приедет через 6 минут


// Проба: что увидит пассажир
print(statusText(for: currentState))
```

## @solution
```swift
// 1. Объяви перечисление RideState. Варианты и их данные:
//    searching       - без данных
//    driverAssigned  - name: String, minutes: Int
//    inProgress      - minutesLeft: Int
//    finished        - price: Int
//    cancelled       - reason: String
enum RideState {
    case searching
    case driverAssigned(name: String, minutes: Int)
    case inProgress(minutesLeft: Int)
    case finished(price: Int)
    case cancelled(reason: String)
}

// 2. Текст для экрана поездки
func statusText(for state: RideState) -> String {
    switch state {
    case .searching:
        return "Ищем машину"
    case .driverAssigned(let name, let minutes):
        return "Водитель \(name) приедет через \(minutes) мин."
    case .inProgress(let minutesLeft):
        return "В пути. Осталось \(minutesLeft) мин."
    case .finished(let price):
        return "Поездка завершена. К оплате: \(price) руб."
    case .cancelled(let reason):
        return "Поездка отменена: \(reason)"
    }
}

// 3. Создай константу currentState: назначен водитель Билол, приедет через 6 минут
let currentState = RideState.driverAssigned(name: "Билол", minutes: 6)

// Проба: что увидит пассажир
print(statusText(for: currentState))
```

## @tests
```swift
__eq("Идёт поиск машины", statusText(for: .searching), "Ищем машину", hint: "Для варианта .searching верни текст: Ищем машину")
__eq("Назначен водитель Билол, приедет через 4 минуты", statusText(for: .driverAssigned(name: "Билол", minutes: 4)), "Водитель Билол приедет через 4 мин.", hint: "Сверь текст с условием: слово Водитель, имя, слова приедет через, число и мин. с точкой")
__eq("Назначен водитель с позывным Сокол-7, приедет через 1 минуту", statusText(for: .driverAssigned(name: "Сокол-7", minutes: 1)), "Водитель Сокол-7 приедет через 1 мин.", hint: "Имя и минуты должны браться из данных варианта: case .driverAssigned(let name, let minutes)")
__eq("Поездка идёт, осталось 12 минут", statusText(for: .inProgress(minutesLeft: 12)), "В пути. Осталось 12 мин.", hint: "Сверь текст с условием: после слов В пути стоит точка, слово Осталось - с большой буквы")
__eq("Поездка идёт, осталось 0 минут", statusText(for: .inProgress(minutesLeft: 0)), "В пути. Осталось 0 мин.", hint: "Число минут должно браться из данных варианта .inProgress")
__eq("Поездка завершена, к оплате 540 руб.", statusText(for: .finished(price: 540)), "Поездка завершена. К оплате: 540 руб.", hint: "Сверь текст с условием: точка после слова завершена, двоеточие после слов К оплате")
__eq("Поездка завершена, к оплате 1275 руб.", statusText(for: .finished(price: 1275)), "Поездка завершена. К оплате: 1275 руб.", hint: "Цена должна браться из данных варианта .finished")
__eq("Поездка отменена: водитель не приехал", statusText(for: .cancelled(reason: "водитель не приехал")), "Поездка отменена: водитель не приехал")
__eq("Поездка отменена: пассажир передумал", statusText(for: .cancelled(reason: "пассажир передумал")), "Поездка отменена: пассажир передумал", hint: "Причина должна браться из данных варианта .cancelled")
if case .driverAssigned(let __t_name, let __t_minutes) = currentState {
    __pass("В currentState лежит состояние: водитель назначен")
    __eq("В currentState имя водителя - Билол", __t_name, "Билол", hint: "Имя водителя передай в скобках с меткой name")
    __eq("В currentState водитель приедет через 6 минут", __t_minutes, 6, hint: "Минуты передай в скобках с меткой minutes")
} else {
    __fail("В currentState лежит состояние: водитель назначен", "Создай значение так: RideState.driverAssigned(name: ..., minutes: ...)")
}
```

## @rules
- must: /\benum\s+RideState\b/ :: Состояние поездки должно быть перечислением: `enum RideState { ... }`.
- mustnot: /\bdefault\s*:/ :: В `switch` по перечислению `default` не нужен. Напиши ветку для каждого из пяти состояний — тогда Swift проверит, что ни одно не забыто.

## @hint1
Перечисление объявляется как в первой задаче модуля. Отличие в том, что у четырёх вариантов из пяти после имени идут круглые скобки с данными. Данные записываются как параметры функции: имя, двоеточие, тип. У `searching` данных нет, и скобки ему не нужны. У `driverAssigned` значений два, они идут через запятую.

В функции `statusText(for:)` нужен `switch` по параметру `state` с пятью ветками. В ветке `searching` — просто вариант с точкой. В остальных после варианта стоят скобки, а в них слово `let` и имя для каждого значения — в том же порядке, что в объявлении. Эти имена работают внутри ветки как обычные константы: вставляй их в текст через интерполяцию.

Тексты сверяй с условием до последней точки: проверка сравнивает строки символ в символ.

Константа `currentState` создаётся через имя типа, точку и вариант. В скобках — значения с метками, как при вызове функции.

Заглушку `return ""` удали: каждая ветка `switch` возвращает свой текст.

## @hint2
Вот перечисление со связанными значениями и функция, которая достаёт из него данные, — на примере пункта назначения:

```swift
enum Destination {
    case home
    case address(street: String, house: Int)
    case airport(terminal: String)
}

func describe(_ destination: Destination) -> String {
    switch destination {
    case .home:
        return "Домой"
    case .address(let street, let house):
        return "\(street), дом \(house)"
    case .airport(let terminal):
        return "Аэропорт, терминал \(terminal)"
    }
}

let trip = Destination.address(street: "Садовая", house: 12)
```

В объявлении у данных есть имена и типы. В ветке `switch` каждое значение получает имя через `let`. При создании значения пишутся метки.

## @hint3
Начало готово. Допиши два варианта в перечислении, три ветки в `switch` и константу:

```swift
enum RideState {
    case searching
    case driverAssigned(name: String, minutes: Int)
    case inProgress(minutesLeft: Int)
    case finished(___)
    case cancelled(___)
}

func statusText(for state: RideState) -> String {
    switch state {
    case .searching:
        return "Ищем машину"
    case .driverAssigned(let name, let minutes):
        return "Водитель \(name) приедет через \(minutes) мин."
    case .inProgress(let minutesLeft):
        return ___
    // ещё две ветки: .finished и .cancelled
    }
}

let currentState = RideState.driverAssigned(name: ___, minutes: ___)
```

В первых двух пропусках — данные вариантов: имя, двоеточие и тип. В третьем — текст про оставшиеся минуты со вставкой `minutesLeft`. В последних двух — имя водителя в кавычках и число минут.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** У каждого варианта `RideState` свой набор данных. Создавая значение, ты обязана их передать: написать `RideState.driverAssigned` без имени и минут Swift не позволит. В `switch` запись `case .driverAssigned(let name, let minutes)` делает сразу два дела: проверяет, что в `state` лежит именно этот вариант, и достаёт из него оба значения в константы `name` и `minutes`. Дальше они вставляются в текст, как любые другие константы.

**Почему так лучше, чем опциональные поля.** В структуре с полями `driverName: String?` и `price: Int?` возможны бессмысленные сочетания: поездка завершена, а цены нет; идёт поиск, а имя водителя уже заполнено. Каждое такое сочетание — будущая ошибка на экране. В перечислении их нет совсем: у `finished` всегда есть цена и никогда нет водителя. В ветке `.finished` константа `name` просто не существует, и вставить её в текст по ошибке не получится — код не соберётся.

**Почему нет `default`.** Вариантов пять, и все пять разобраны. Если команда добавит шестое состояние, например «водитель ждёт у подъезда», Swift сам укажет на этот `switch` и попросит новую ветку.

**Типичные ошибки:**

- в ветке забыто слово `let`: `case .finished(price):` — Swift ищет уже существующую константу `price` и не находит;
- значения в ветке перепутаны местами: `case .driverAssigned(let minutes, let name)` — порядок должен быть как в объявлении, иначе в `minutes` попадёт имя;
- данные объявлены без имён: `case finished(Int)` — так тоже бывает, но проверка создаёт значения с метками (`price:`, `name:`), поэтому имена в объявлении должны совпадать с условием;
- при создании значения пропущены метки: `.driverAssigned("Билол", 6)` — раз в объявлении у данных есть имена, их нужно писать;
- попытка сравнить состояние через `==` — для перечислений со связанными значениями используй `switch`.
