---
title: Общий термостат
concept: Ссылочная семантика и оператор ===
---

## @description

### Контекст
Тестировщик прислал отчёт об ошибке: «На экране комнаты подняла температуру до 24 градусов. Открываю экран расписания — там по-прежнему 21. Термостат в гостиной один, почему цифры разные?»

Тимлид нашёл причину. В прототипе `Thermostat` объявили структурой. Каждый экран получил свою копию, и копии разошлись. Задача для тебя: «Сделай термостат классом, чтобы все экраны работали с одним объектом. И допиши три функции, которые ждёт команда сценариев».

### Новое в Swift
**Структура — это значение.** В «Уюте» ты делала черновик брони: меняла копию, а оригинал оставался прежним. При присваивании структура копируется целиком:

```swift
struct SpeakerSettings {
    var volume: Int
}

var kitchen = SpeakerSettings(volume: 30)
var remote = kitchen       // копия
remote.volume = 80
print(kitchen.volume)      // 30 - оригинал не изменился
```

**Класс — это ссылка.** Тот же код с классом ведёт себя иначе:

```swift
class Speaker {
    var volume: Int

    init(volume: Int) {
        self.volume = volume
    }
}

let kitchen = Speaker(volume: 30)
let remote = kitchen       // вторая ссылка на тот же объект
remote.volume = 80
print(kitchen.volume)      // 80
```

Объект появляется один раз — там, где вызван `Speaker(volume: 30)`. В переменной лежит не сам объект, а **ссылка** на него. Представь пульт от колонки. Строка `let remote = kitchen` делает второй пульт, а колонка остаётся одна. Каким пультом ни меняй громкость — меняется она у одной и той же колонки.

Из этого следуют четыре вещи.

**`let` не мешает менять объект.** Константа запрещает перенастроить пульт на другую колонку. А нажимать на нём кнопки можно: свойства `var` у объекта меняются.

**Функция получает тот же объект.** Не копию, поэтому `inout` не нужен:

```swift
func mute(_ speaker: Speaker) {
    speaker.volume = 0
}

mute(kitchen)
print(kitchen.volume)      // 0
```

**«Тот же самый» и «такой же» — разные вопросы.** Оператор `===` (три знака равно) проверяет, ведут ли две ссылки к одному объекту. Обратный оператор — `!==`.

```swift
let bedroom = Speaker(volume: 0)
print(remote === kitchen)     // true: один объект
print(bedroom === kitchen)    // false: громкость одинаковая, но объекты разные
```

**Копию нужно создавать явно.** Если нужен второй независимый объект, вызови инициализатор ещё раз: `Speaker(volume: kitchen.volume)`.

### Задача
1. Преврати `Thermostat` в класс: замени `struct` на `class`, добавь инициализатор `init(name:targetTemperature:)` и убери слово `mutating`.
2. В сценарии внизу замени `var roomThermostat` на `let roomThermostat`. Убедись, что код по-прежнему собирается.
3. Допиши функцию `applyEcoMode(to:)`: она ставит термостату `targetTemperature`, равную `18`.
4. Допиши функцию `isSameDevice(_:_:)`: она возвращает `true`, только если обе ссылки ведут к одному и тому же объекту. Два разных термостата с одинаковыми названием и температурой — это `false`.
5. Допиши функцию `makeTwin(of:name:)`: она создаёт и возвращает **новый** термостат с названием `name` и такой же целевой температурой, как у переданного. Двойник независим: его изменения не затрагивают оригинал.

### Пример
```swift
let hall = Thermostat(name: "Прихожая", targetTemperature: 22)
let sameHall = hall
applyEcoMode(to: sameHall)
hall.targetTemperature               // 18
isSameDevice(hall, sameHall)         // true

let twin = makeTwin(of: hall, name: "Кладовая")
twin.targetTemperature               // 18
isSameDevice(hall, twin)             // false
```

Сценарий из редактора должен вывести:

```text
Экран комнаты: 24
Экран расписания: 24
Один и тот же термостат: true
```

## @starter
```swift
// 1. Прототип термостата. Сейчас это структура, поэтому у каждого экрана своя копия
struct Thermostat {
    let name: String
    var targetTemperature: Int

    mutating func warmUp(by degrees: Int) {
        targetTemperature += degrees
    }
}

// 3. Эко-режим: ставит термостату целевую температуру 18 градусов
func applyEcoMode(to thermostat: Thermostat) {

}

// 4. Проверяет, ведут ли обе ссылки к одному и тому же объекту
func isSameDevice(_ first: Thermostat, _ second: Thermostat) -> Bool {
    // Заглушка: замени её сравнением ссылок
    return false
}

// 5. Создаёт новый независимый термостат с названием name и той же температурой
func makeTwin(of thermostat: Thermostat, name: String) -> Thermostat {
    // Заглушка: сейчас функция возвращает тот же термостат, а нужен новый
    return thermostat
}

// Сценарий из отчёта тестировщика: два экрана получают термостат гостиной
// 2. Когда Thermostat станет классом, замени здесь var на let
var roomThermostat = Thermostat(name: "Гостиная", targetTemperature: 21)
let scheduleThermostat = roomThermostat

roomThermostat.warmUp(by: 3)
print("Экран комнаты: \(roomThermostat.targetTemperature)")
print("Экран расписания: \(scheduleThermostat.targetTemperature)")
print("Один и тот же термостат: \(isSameDevice(roomThermostat, scheduleThermostat))")
```

## @solution
```swift
// 1. Термостат - класс: все экраны работают с одним объектом
class Thermostat {
    let name: String
    var targetTemperature: Int

    init(name: String, targetTemperature: Int) {
        self.name = name
        self.targetTemperature = targetTemperature
    }

    func warmUp(by degrees: Int) {
        targetTemperature += degrees
    }
}

// 3. Эко-режим: ставит термостату целевую температуру 18 градусов
func applyEcoMode(to thermostat: Thermostat) {
    thermostat.targetTemperature = 18
}

// 4. Проверяет, ведут ли обе ссылки к одному и тому же объекту
func isSameDevice(_ first: Thermostat, _ second: Thermostat) -> Bool {
    return first === second
}

// 5. Создаёт новый независимый термостат с названием name и той же температурой
func makeTwin(of thermostat: Thermostat, name: String) -> Thermostat {
    return Thermostat(name: name, targetTemperature: thermostat.targetTemperature)
}

// Сценарий из отчёта тестировщика: два экрана получают термостат гостиной
// 2. Когда Thermostat станет классом, замени здесь var на let
let roomThermostat = Thermostat(name: "Гостиная", targetTemperature: 21)
let scheduleThermostat = roomThermostat

roomThermostat.warmUp(by: 3)
print("Экран комнаты: \(roomThermostat.targetTemperature)")
print("Экран расписания: \(scheduleThermostat.targetTemperature)")
print("Один и тот же термостат: \(isSameDevice(roomThermostat, scheduleThermostat))")
```

## @output
```
Экран комнаты: 24
Экран расписания: 24
Один и тот же термостат: true
```

## @tests
```swift
func __t_identical(_ a: Any, _ b: Any) -> Bool {
    return (a as AnyObject) === (b as AnyObject)
}

var __t_bedroom = Thermostat(name: "Спальня", targetTemperature: 20)
var __t_alias = __t_bedroom
__eq("Название сохраняется при создании", __t_bedroom.name, "Спальня", hint: "В init нужно записать оба параметра в свойства через self")
__eq("Температура сохраняется при создании", __t_bedroom.targetTemperature, 20, hint: "В init нужно записать оба параметра в свойства через self")
__t_alias.warmUp(by: 2)
__eq("Нагрев через вторую ссылку виден по первой: 20 + 2 = 22", __t_bedroom.targetTemperature, 22, hint: "Thermostat должен быть классом: тогда присваивание даёт вторую ссылку, а не копию")

applyEcoMode(to: __t_bedroom)
__eq("applyEcoMode ставит термостату 18 градусов", __t_bedroom.targetTemperature, 18, hint: "Внутри функции запиши 18 в свойство targetTemperature переданного термостата")
__eq("Эко-режим виден и через вторую ссылку", __t_alias.targetTemperature, 18)

var __t_balcony = Thermostat(name: "Балкон", targetTemperature: 12)
applyEcoMode(to: __t_balcony)
__eq("Эко-режим для термостата с 12 градусами - тоже ровно 18", __t_balcony.targetTemperature, 18, hint: "Эко-режим не уменьшает температуру на сколько-то, а ставит ровно 18")

__eq("isSameDevice: две ссылки на один объект", isSameDevice(__t_bedroom, __t_alias), true, hint: "Сравни ссылки оператором ===")
var __t_lookalike = Thermostat(name: "Спальня", targetTemperature: 18)
__eq("isSameDevice: разные объекты с одинаковыми названием и температурой", isSameDevice(__t_bedroom, __t_lookalike), false, hint: "Сравнивать нужно не свойства, а сами ссылки: first === second")
__eq("isSameDevice: объект сравнивается сам с собой", isSameDevice(__t_lookalike, __t_lookalike), true)
__eq("isSameDevice: совсем разные термостаты", isSameDevice(__t_bedroom, __t_balcony), false)

var __t_twin = makeTwin(of: __t_bedroom, name: "Детская")
__eq("У двойника название из параметра name", __t_twin.name, "Детская")
__eq("У двойника температура оригинала", __t_twin.targetTemperature, 18, hint: "Температуру нужно взять из переданного термостата, а не написать числом")
__ok("makeTwin возвращает новый объект, а не тот же самый", !__t_identical(__t_twin, __t_bedroom), hint: "Внутри makeTwin создай объект заново: Thermostat(name: ..., targetTemperature: ...)")
__t_twin.warmUp(by: 4)
__eq("Нагрев двойника не меняет оригинал", __t_bedroom.targetTemperature, 18, hint: "Двойник должен быть отдельным объектом")
__eq("Сам двойник нагрелся: 18 + 4 = 22", __t_twin.targetTemperature, 22)

var __t_warm = makeTwin(of: __t_twin, name: "Ванная")
__eq("Двойник термостата с 22 градусами тоже получает 22", __t_warm.targetTemperature, 22, hint: "Температуру нужно взять из переданного термостата, а не написать числом")
```

## @rules
- must: /\bclass\s+Thermostat\b/ :: Термостат должен быть классом: замени `struct` на `class`.
- must: /===/ :: В `isSameDevice` сравни ссылки оператором `===` — он проверяет, один ли это объект.
- must: /\blet\s+roomThermostat\b/ :: В сценарии замени `var roomThermostat` на `let roomThermostat`: чтобы менять объект класса, `var` не нужен.

## @hint1
Начни с самого термостата: пока он структура, остальные шаги не получатся.

Замени первое слово объявления на `class`. Сразу появятся две ошибки, и обе тебе знакомы по прошлой задаче. Первая: у класса нет автоматического инициализатора, значит, нужен `init` с двумя параметрами — названием и температурой. Вторая: слово `mutating` в классе запрещено, его нужно просто стереть.

После этого запусти проверку. Сценарий уже выведет 24 на обоих экранах: теперь `scheduleThermostat` — вторая ссылка на тот же объект, а не копия. Заодно замени в сценарии `var` на `let` и убедись, что `warmUp` всё равно работает.

Дальше функции. В `applyEcoMode(to:)` одна строка: в свойство `targetTemperature` переданного термостата записывается 18. Функция получила ссылку на настоящий объект, так что изменение увидят все.

В `isSameDevice(_:_:)` верни результат сравнения двух параметров оператором из трёх знаков равно.

В `makeTwin(of:name:)` создай новый объект вызовом инициализатора: название возьми из параметра `name`, температуру — из свойства переданного термостата.

## @hint2
Структура превращается в класс в три движения: другое слово в начале, свой `init`, никакого `mutating`:

```swift
class Speaker {
    let room: String
    var volume: Int

    init(room: String, volume: Int) {
        self.room = room
        self.volume = volume
    }

    func louder(by step: Int) {
        volume += step
    }
}
```

А так сравнивают ссылки и создают независимый объект:

```swift
let kitchen = Speaker(room: "Кухня", volume: 30)
let remote = kitchen
print(remote === kitchen)                               // true
let copy = Speaker(room: "Спальня", volume: kitchen.volume)
print(copy === kitchen)                                 // false
```

## @hint3
Класс и сценарий готовы. Заполни пропуски в функциях:

```swift
class Thermostat {
    let name: String
    var targetTemperature: Int

    init(name: String, targetTemperature: Int) {
        self.name = name
        self.targetTemperature = targetTemperature
    }

    func warmUp(by degrees: Int) {
        targetTemperature += degrees
    }
}

func applyEcoMode(to thermostat: Thermostat) {
    thermostat.___ = 18
}

func isSameDevice(_ first: Thermostat, _ second: Thermostat) -> Bool {
    return first ___ second
}

func makeTwin(of thermostat: Thermostat, name: String) -> Thermostat {
    return Thermostat(name: ___, targetTemperature: thermostat.targetTemperature)
}
```

```swift
let roomThermostat = Thermostat(name: "Гостиная", targetTemperature: 21)
```

В первом пропуске — свойство с целевой температурой. Во втором — оператор, который проверяет, один ли это объект. В третьем — параметр с названием двойника.

## @hint4
Вот готовое решение:

{{solution}}

**Что было не так.** Структура — это значение. Строка `let scheduleThermostat = roomThermostat` делала копию, и `warmUp` нагревал только один из двух термостатов. Поэтому экраны показывали 24 и 21.

**Что изменилось.** Теперь `Thermostat` — класс. Объект создаётся один раз, вызовом `Thermostat(name: "Гостиная", targetTemperature: 21)`. В `roomThermostat` лежит ссылка на него, а `let scheduleThermostat = roomThermostat` копирует только ссылку. Оба имени ведут к одному объекту, и оба экрана видят 24.

**Почему хватает `let`.** Константа запрещает положить в `roomThermostat` ссылку на другой термостат. А менять сам объект она не мешает. Поэтому объекты классов почти всегда хранят в `let`.

**Как устроены функции.** `applyEcoMode(to:)` получает ссылку на настоящий термостат и меняет его свойство — без `inout`. `isSameDevice` сравнивает ссылки через `===`: одинаковые свойства его не интересуют, важно только, один ли это объект. `makeTwin` вызывает инициализатор, а каждый вызов инициализатора — это новый объект. Другого способа получить независимую копию у класса нет.

**Типичные ошибки:**

- `first.name == second.name` в `isSameDevice` — два разных термостата в комнатах с одинаковым названием окажутся «одним устройством»;
- `return thermostat` в `makeTwin` — это не двойник, а ещё одна ссылка на оригинал: нагреешь «двойника» — нагреется и он;
- `let twin = thermostat`, а потом смена свойств у `twin` — по той же причине меняется оригинал;
- `inout` в `applyEcoMode` — для объектов он не нужен: функция и так работает с тем же объектом.
