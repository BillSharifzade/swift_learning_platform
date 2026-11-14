---
title: Что это за устройство
concept: Проверка и приведение типов — is, as?, as!
---

## @description

### Контекст
Из поддержки пришла жалоба: «Приложение закрывается, когда открываю карточку термостата. Карточка лампы открывается нормально».

Тимлид нашёл виновника — функцию `detailsText(for:)`. Она получает `Device`, а показать должна подробности: у лампы яркость, у термостата температуру. Кто-то написал в ней `device as! Lamp`, рассчитывая, что карточки бывают только у ламп. Термостат лампой не оказался, и приложение упало.

«Почини карточку, — пишет тимлид. — И раз уж ты в этом коде, допиши для экрана комнаты две функции: сколько в комнате ламп и кнопку "Приглушить свет", которая ставит всем лампам одну яркость».

### Новое в Swift
В прошлой задаче устройства лежали в массиве `[Device]`, и через него было видно только то, что есть у самого `Device`. Но иногда нужно знать, кто перед тобой на самом деле, и добраться до его собственных свойств. Для этого есть три оператора.

Примеры — на датчиках:

```swift
let sensors: [Sensor] = [
    WaterSensor(name: "Ванная"),
    SmokeSensor(name: "Коридор"),
    WaterSensor(name: "Кухня")
]
```

**`is` — проверка типа.** Отвечает `true` или `false`: является ли объект экземпляром этого класса или его наследника.

```swift
let first = sensors[0]
print(first is WaterSensor)   // true
print(first is SmokeSensor)   // false
print(first is Sensor)        // true: датчик протечки — тоже датчик
```

**`as?` — попытка приведения.** «Если это датчик протечки, дай мне его как датчик протечки». Результат — опционал: объект нужного типа или `nil`. Разворачивают его как обычно, через `if let` или `guard let`:

```swift
if let water = first as? WaterSensor {
    print("Контакты мокрые: \(water.isWet)")   // свойство наследника доступно
} else {
    print("Это не датчик протечки")
}
```

Внутри `if let` константа `water` имеет тип `WaterSensor`, и у неё видны все его свойства. Снаружи `first` — по-прежнему просто `Sensor`.

**`as!` — приведение без проверки.** «Я уверена, что это датчик протечки». Если это правда, получишь объект нужного типа. Если нет — программа упадёт:

```swift
let smoke = sensors[1] as! WaterSensor   // падение: это датчик дыма
```

Это та же история, что с `!` у опционалов: восклицательный знак обещает, что всё в порядке, и Swift не проверяет обещание заранее. В рабочем коде `as!` почти не встречается. Безопасный путь — `as?` с развёрткой.

> 💡 В Swift есть типы-«что угодно». `Any` — значение любого типа: строка, число, объект. `AnyObject` — любой объект класса. Достать из них конкретное значение помогают те же `is` и `as?`: если `let value: Any = 70`, то `value as? Int` даст `70`, а `value as? String` — `nil`. Это пригодится в следующей задаче.

### Задача
Классы устройств в редакторе уже готовы, их менять не нужно.

1. Перепиши `detailsText(for:)` без `as!`. Функция возвращает `String`:
   - для лампы — `Лампа, яркость` и число со знаком процента: `Лампа, яркость 70%`;
   - для термостата — `Термостат, температура` и число: `Термостат, температура 22`;
   - для любого другого устройства — `Устройство без настроек`.
2. Напиши функцию `countLamps(in:)`: принимает `[Device]`, возвращает `Int` — сколько среди устройств ламп. Используй `is`.
3. Напиши функцию `dimLamps(in:to:)`: принимает `[Device]` и яркость `Int`. Каждой лампе в массиве она ставит эту яркость. Остальные устройства не трогает. Результата у функции нет.

Наследники лампы — тоже лампы: если однажды появится цветная лампа, унаследованная от `Lamp`, её нужно считать и приглушать вместе со всеми.

### Пример
```swift
let kitchen: [Device] = [
    Thermostat(name: "Термостат на кухне", room: "Кухня", targetTemperature: 20),
    Lamp(name: "Подсветка", room: "Кухня", brightness: 90)
]
countLamps(in: kitchen)          // 1
detailsText(for: kitchen[0])     // "Термостат, температура 20"
dimLamps(in: kitchen, to: 40)
detailsText(for: kitchen[1])     // "Лампа, яркость 40%"
```

Сценарий из редактора должен вывести:

```text
Ламп в комнате: 2
Торшер - Лампа, яркость 30%
Термостат у окна - Термостат, температура 22
Розетка телевизора - Устройство без настроек
Люстра - Лампа, яркость 30%
```

## @starter
```swift
// Классы устройств. Их менять не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    init(name: String, room: String) {
        self.name = name
        self.room = room
    }
}

class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }
}

class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }
}

final class SmartSocket: Device {
    let isAlwaysOn: Bool

    init(name: String, room: String, isAlwaysOn: Bool) {
        self.isAlwaysOn = isAlwaysOn
        super.init(name: name, room: room)
    }
}

// 1. Текст для карточки устройства. Сейчас падает на всём, что не лампа
func detailsText(for device: Device) -> String {
    let lamp = device as! Lamp
    return "Лампа, яркость \(lamp.brightness)%"
}

// 2. Сколько среди устройств ламп
func countLamps(in devices: [Device]) -> Int {
    // Заглушка: замени её своим кодом
    return 0
}

// 3. Кнопка "Приглушить свет": всем лампам одна яркость
func dimLamps(in devices: [Device], to brightness: Int) {

}

// Сценарий: экран гостиной. Этот код менять не нужно
let livingRoom: [Device] = [
    Lamp(name: "Торшер", room: "Гостиная", brightness: 70),
    Thermostat(name: "Термостат у окна", room: "Гостиная", targetTemperature: 22),
    SmartSocket(name: "Розетка телевизора", room: "Гостиная", isAlwaysOn: false),
    Lamp(name: "Люстра", room: "Гостиная", brightness: 100)
]

print("Ламп в комнате: \(countLamps(in: livingRoom))")
dimLamps(in: livingRoom, to: 30)
for device in livingRoom {
    print("\(device.name) - \(detailsText(for: device))")
}
```

## @solution
```swift
// Классы устройств. Их менять не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    init(name: String, room: String) {
        self.name = name
        self.room = room
    }
}

class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }
}

class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }
}

final class SmartSocket: Device {
    let isAlwaysOn: Bool

    init(name: String, room: String, isAlwaysOn: Bool) {
        self.isAlwaysOn = isAlwaysOn
        super.init(name: name, room: room)
    }
}

// 1. Текст для карточки устройства
func detailsText(for device: Device) -> String {
    if let lamp = device as? Lamp {
        return "Лампа, яркость \(lamp.brightness)%"
    }
    if let thermostat = device as? Thermostat {
        return "Термостат, температура \(thermostat.targetTemperature)"
    }
    return "Устройство без настроек"
}

// 2. Сколько среди устройств ламп
func countLamps(in devices: [Device]) -> Int {
    return devices.filter { $0 is Lamp }.count
}

// 3. Кнопка "Приглушить свет": всем лампам одна яркость
func dimLamps(in devices: [Device], to brightness: Int) {
    for device in devices {
        if let lamp = device as? Lamp {
            lamp.brightness = brightness
        }
    }
}

// Сценарий: экран гостиной. Этот код менять не нужно
let livingRoom: [Device] = [
    Lamp(name: "Торшер", room: "Гостиная", brightness: 70),
    Thermostat(name: "Термостат у окна", room: "Гостиная", targetTemperature: 22),
    SmartSocket(name: "Розетка телевизора", room: "Гостиная", isAlwaysOn: false),
    Lamp(name: "Люстра", room: "Гостиная", brightness: 100)
]

print("Ламп в комнате: \(countLamps(in: livingRoom))")
dimLamps(in: livingRoom, to: 30)
for device in livingRoom {
    print("\(device.name) - \(detailsText(for: device))")
}
```

## @output
```
Ламп в комнате: 2
Торшер - Лампа, яркость 30%
Термостат у окна - Термостат, температура 22
Розетка телевизора - Устройство без настроек
Люстра - Лампа, яркость 30%
```

## @tests
```swift
// Цветная лампа — наследник Lamp, которого в задаче нет
class __t_ColorLamp: Lamp {
    var color = "тёплый белый"
}

let __t_lamp = Lamp(name: "Бра", room: "Спальня", brightness: 45)
let __t_thermo = Thermostat(name: "Тёплый пол", room: "Ванная", targetTemperature: 27)
let __t_socket = SmartSocket(name: "Розетка утюга", room: "Спальня", isAlwaysOn: false)
let __t_plain = Device(name: "Робот-пылесос", room: "Коридор")
let __t_color = __t_ColorLamp(name: "Лента над кроватью", room: "Спальня", brightness: 80)

__eq("Карточка лампы с яркостью 45", detailsText(for: __t_lamp), "Лампа, яркость 45%", hint: "Для лампы: if let lamp = device as? Lamp, а в строку вставь lamp.brightness")
__eq("Карточка термостата с температурой 27", detailsText(for: __t_thermo), "Термостат, температура 27", hint: "Для термостата нужна своя проверка: if let thermostat = device as? Thermostat")
__eq("Карточка розетки", detailsText(for: __t_socket), "Устройство без настроек", hint: "Если устройство не лампа и не термостат, верни Устройство без настроек")
__eq("Карточка простого Device", detailsText(for: __t_plain), "Устройство без настроек")
__eq("Карточка цветной лампы — наследника Lamp", detailsText(for: __t_color), "Лампа, яркость 80%", hint: "Наследник лампы — тоже лампа: as? Lamp с ним сработает")
__t_thermo.targetTemperature = 19
__eq("Карточка термостата берёт температуру из свойства", detailsText(for: __t_thermo), "Термостат, температура 19", hint: "Число вставляй из свойства targetTemperature, а не пиши готовым")

__eq("countLamps: пустой список", countLamps(in: []), 0, hint: "В пустом списке ламп нет: результат 0")
__eq("countLamps: ламп нет", countLamps(in: [__t_thermo, __t_socket, __t_plain]), 0, hint: "Считай только те устройства, для которых device is Lamp равно true")
__eq("countLamps: одна лампа среди других устройств", countLamps(in: [__t_thermo, __t_lamp, __t_socket]), 1)
__eq("countLamps: обычная и цветная лампы", countLamps(in: [__t_lamp, __t_plain, __t_color]), 2, hint: "Наследник лампы — тоже лампа: is Lamp для него даёт true")
__eq("countLamps: одна и та же лампа дважды", countLamps(in: [__t_lamp, __t_lamp]), 2)

let __t_bedroom: [Device] = [__t_lamp, __t_thermo, __t_color, __t_socket]
dimLamps(in: __t_bedroom, to: 25)
__eq("dimLamps: обычная лампа получила яркость 25", __t_lamp.brightness, 25, hint: "В цикле разверни каждое устройство через as? Lamp и запиши яркость из параметра")
__eq("dimLamps: цветная лампа тоже получила 25", __t_color.brightness, 25, hint: "Наследник лампы — тоже лампа: as? Lamp с ним сработает")
__eq("dimLamps: термостат не тронут", __t_thermo.targetTemperature, 19, hint: "Менять нужно только лампы")
dimLamps(in: __t_bedroom, to: 0)
__eq("dimLamps до нуля", __t_lamp.brightness, 0)
dimLamps(in: [], to: 50)
__pass("dimLamps с пустым списком не падает")
dimLamps(in: [__t_thermo, __t_socket], to: 100)
__eq("dimLamps без ламп ничего не меняет", __t_thermo.targetTemperature, 19)
```

## @rules
- mustnot: /\bas!/ :: В коде осталось `as!` — оно роняет приложение, если тип не тот. Используй `as?` и развёртку через `if let`.
- must: /\bis\s+Lamp\b/ :: В `countLamps` проверь тип оператором `is`: `device is Lamp`.

## @hint1
Начни с карточки — из-за неё всё падает. Вместо строки с восклицательным знаком нужна попытка: «если это лампа — дай мне её как лампу». Это `if let` с оператором `as?`. Внутри — возврат строки с яркостью. Ниже такая же попытка для термостата, с его температурой. А в самом конце, если ни одна попытка не удалась, верни текст для всех остальных устройств.

`countLamps(in:)`: нужно посчитать элементы, которые отвечают `true` на вопрос «ты лампа?». Этот вопрос задаётся оператором `is`. Можно отобрать такие элементы через `filter` и взять у результата `count`, а можно пройти циклом со счётчиком.

`dimLamps(in:to:)`: цикл по устройствам, внутри — `if let` с `as?`. Если устройство оказалось лампой, запиши ей в яркость значение параметра. Объекты — классы, поэтому изменения увидят все, кто держит ссылки на эти лампы. Для остальных устройств ничего делать не нужно.

## @hint2
Проверка и приведение выглядят так:

```swift
if let water = sensor as? WaterSensor {
    // здесь water - датчик протечки, его свойства доступны
    return "Протечка: \(water.isWet)"
}

let waterCount = sensors.filter { $0 is WaterSensor }.count
```

В `detailsText` таких `if let` два подряд, а после них — запасной `return`.

## @hint3
Заполни пропуски:

```swift
func detailsText(for device: Device) -> String {
    if let lamp = device ___ Lamp {
        return "Лампа, яркость \(lamp.brightness)%"
    }
    if let thermostat = device as? Thermostat {
        return "Термостат, температура \(___)"
    }
    return "Устройство без настроек"
}

func countLamps(in devices: [Device]) -> Int {
    return devices.filter { $0 ___ Lamp }.count
}

func dimLamps(in devices: [Device], to brightness: Int) {
    for device in devices {
        if let lamp = device as? Lamp {
            ___ = brightness
        }
    }
}
```

По порядку: оператор безопасного приведения; свойство с температурой у развёрнутого термостата; оператор проверки типа; свойство яркости у развёрнутой лампы.

## @hint4
Вот готовое решение:

{{solution}}

**Почему падало.** `device as! Lamp` обещает Swift, что устройство — лампа. Для торшера обещание верное. Для термостата — нет, и программа останавливается с ошибкой приведения. Это тот же риск, что у `!` с опционалами: проверка откладывается до момента, когда уже поздно.

**Как работает `detailsText`.** `device as? Lamp` пробует посмотреть на устройство как на лампу. Если получилось, `if let` разворачивает результат, и внутри доступна `lamp.brightness`. Если нет — получится `nil`, и функция идёт к следующей попытке, с термостатом. Последний `return` срабатывает, только когда устройство ни то, ни другое.

**`is` против `as?`.** В `countLamps` сама лампа не нужна — только ответ «да или нет». Для этого и есть `is`. В `dimLamps` лампа нужна, чтобы поменять ей яркость, поэтому там `as?` с развёрткой.

**Наследники.** И `is Lamp`, и `as? Lamp` срабатывают для любого наследника лампы. Проверка подложила твоим функциям цветную лампу, которой в задаче нет, — и её посчитали и приглушили вместе со всеми.

**Типичные ошибки:**

- `as!` заменено на `as?`, но без `if let` — получится опционал `Lamp?`, и `lamp.brightness` не соберётся;
- проверка `device.name == "Торшер"` вместо проверки типа — работает только для одного устройства;
- в `dimLamps` копия яркости кладётся в отдельную переменную, а не в `lamp.brightness` — лампы остаются прежними;
- забыт последний `return` в `detailsText` — Swift сообщит, что функция может ничего не вернуть.
