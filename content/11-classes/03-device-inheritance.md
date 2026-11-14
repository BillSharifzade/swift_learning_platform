---
title: Семейство устройств
concept: Наследование и super.init
---

## @description

### Контекст
Устройств в «Гнезде» становится больше. Тимлид открыл код лампы и термостата и нашёл в них одно и то же: название, комнату, флаг `isOn`, методы `turnOn()` и `turnOff()`, заголовок для списка устройств.

«На очереди розетки, колонки и датчики, — пишет он в задаче. — Если копировать общий код в каждый класс, однажды мы исправим ошибку в одном месте и забудем про остальные. Я вынес общее в класс `Device`. Сделай лампу и термостат его наследниками, а лампе добавь ползунок яркости».

### Новое в Swift
**Наследование** — способ сказать: «этот класс — разновидность вон того». Класс-наследник получает все свойства и методы родителя и добавляет к ним свои. Родителя указывают через двоеточие после имени класса:

```swift
class Sensor {
    let name: String
    var batteryLevel = 100

    init(name: String) {
        self.name = name
    }

    func batteryText() -> String {
        return "\(name): заряд \(batteryLevel)%"
    }
}

class DoorSensor: Sensor {
    var isOpen = false
}

let frontDoor = DoorSensor(name: "Входная дверь")
frontDoor.batteryLevel = 85
print(frontDoor.batteryText())   // Входная дверь: заряд 85%
print(frontDoor.isOpen)          // false
```

`Sensor` — **родитель** (его ещё называют базовым классом или суперклассом). `DoorSensor` — **наследник**. В нём объявлено одно свойство, но у `frontDoor` есть и `name`, и `batteryLevel`, и метод `batteryText()`: всё это досталось от родителя. Даже инициализатор родительский — своих свойств без значения у наследника нет, и ему хватает `init(name:)`.

**Свой init и `super.init`.** Если у наследника есть свойство без значения по умолчанию, ему нужен собственный инициализатор. Он работает в два шага:

```swift
class LeakSensor: Sensor {
    let maxHumidity: Int

    init(name: String, maxHumidity: Int) {
        self.maxHumidity = maxHumidity   // 1. свои свойства
        super.init(name: name)           // 2. родительская часть
    }
}
```

Слово `super` означает «родитель». Вызов `super.init(name: name)` просит инициализатор родителя заполнить его свойства — `name` и `batteryLevel`. Сам наследник записать `self.name` не может: это забота родителя.

Порядок важен. Сначала наследник заполняет свои свойства, потом вызывает `super.init`. Только после этого объект готов целиком, и можно пользоваться унаследованным: читать `name`, вызывать методы. В обычных методах наследника родительские свойства и методы доступны сразу, будто объявлены в нём самом.

> ⚠️ Объявить в наследнике то, что уже есть у родителя, нельзя. Если написать в `LeakSensor` ещё раз `let name: String`, Swift ответит ошибкой со словами `cannot override` — «нельзя переопределить»: такое свойство у родителя уже есть. Название у датчика одно, и хранится оно в одном месте.

### Задача
Класс `Device` в редакторе уже готов, его менять не нужно. У него есть свойства `name`, `room`, `isOn`, инициализатор `init(name:room:)` и методы `turnOn()`, `turnOff()` и `title()`.

1. Сделай `Lamp` наследником `Device`: `class Lamp: Device`. Убери из лампы всё, что уже есть у родителя. Своё у лампы — только свойство `brightness` (`Int`, переменная) и инициализатор `init(name:room:brightness:)`. Он записывает яркость и вызывает `super.init(name:room:)`.
2. Добавь лампе метод `setBrightness(_:)` с одним параметром типа `Int` — так работает ползунок яркости. Метод записывает значение в `brightness`, а потом решает, что делать с лампой: если новая яркость равна `0` — выключает её, если больше нуля — включает. Для этого вызови унаследованные `turnOff()` и `turnOn()`.
3. Так же переделай `Thermostat`: `class Thermostat: Device`. Своё у термостата — свойство `targetTemperature` (`Int`, переменная) и инициализатор `init(name:room:targetTemperature:)`.

Сценарий внизу менять не нужно. Сейчас код не собирается: у лампы ещё нет метода `setBrightness`.

### Пример
```swift
let desk = Lamp(name: "Лампа на столе", room: "Кабинет", brightness: 80)
desk.title()           // "Лампа на столе (Кабинет)"
desk.setBrightness(25)
desk.isOn              // true
desk.setBrightness(0)
desk.isOn              // false, а desk.brightness равно 0
```

Сценарий из редактора должен вывести:

```text
Торшер (Гостиная): яркость 40, включена: true
Торшер (Гостиная): яркость 0, включена: false
Термостат (Спальня): температура 21, включён: true
```

## @starter
```swift
// Общий родитель всех устройств «Гнезда». Этот класс уже готов, менять его не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    init(name: String, room: String) {
        self.name = name
        self.room = room
    }

    func turnOn() {
        isOn = true
    }

    func turnOff() {
        isOn = false
    }

    func title() -> String {
        return "\(name) (\(room))"
    }
}

// 1. Лампа. Сейчас она повторяет всё, что уже есть в Device.
//    Сделай её наследником Device и оставь только своё: яркость и init
// 2. Добавь лампе метод setBrightness(_:)
class Lamp {
    let name: String
    let room: String
    var isOn = false
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.name = name
        self.room = room
        self.brightness = brightness
    }

    func turnOn() {
        isOn = true
    }

    func turnOff() {
        isOn = false
    }

    func title() -> String {
        return "\(name) (\(room))"
    }
}

// 3. Термостат. Его тоже сделай наследником Device
class Thermostat {
    let name: String
    let room: String
    var isOn = false
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.name = name
        self.room = room
        self.targetTemperature = targetTemperature
    }

    func turnOn() {
        isOn = true
    }

    func turnOff() {
        isOn = false
    }

    func title() -> String {
        return "\(name) (\(room))"
    }
}

// Сценарий: вечер в гостиной и спальне. Этот код менять не нужно
let floorLamp = Lamp(name: "Торшер", room: "Гостиная", brightness: 70)
let bedroomThermostat = Thermostat(name: "Термостат", room: "Спальня", targetTemperature: 21)

floorLamp.setBrightness(40)
print("\(floorLamp.title()): яркость \(floorLamp.brightness), включена: \(floorLamp.isOn)")

floorLamp.setBrightness(0)
print("\(floorLamp.title()): яркость \(floorLamp.brightness), включена: \(floorLamp.isOn)")

bedroomThermostat.turnOn()
print("\(bedroomThermostat.title()): температура \(bedroomThermostat.targetTemperature), включён: \(bedroomThermostat.isOn)")
```

## @solution
```swift
// Общий родитель всех устройств «Гнезда». Этот класс уже готов, менять его не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    init(name: String, room: String) {
        self.name = name
        self.room = room
    }

    func turnOn() {
        isOn = true
    }

    func turnOff() {
        isOn = false
    }

    func title() -> String {
        return "\(name) (\(room))"
    }
}

// 1. Лампа - наследник Device: у неё только своё - яркость и init
// 2. Метод setBrightness(_:) - ползунок яркости
class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

    func setBrightness(_ value: Int) {
        brightness = value
        if value == 0 {
            turnOff()
        } else {
            turnOn()
        }
    }
}

// 3. Термостат - тоже наследник Device
class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }
}

// Сценарий: вечер в гостиной и спальне. Этот код менять не нужно
let floorLamp = Lamp(name: "Торшер", room: "Гостиная", brightness: 70)
let bedroomThermostat = Thermostat(name: "Термостат", room: "Спальня", targetTemperature: 21)

floorLamp.setBrightness(40)
print("\(floorLamp.title()): яркость \(floorLamp.brightness), включена: \(floorLamp.isOn)")

floorLamp.setBrightness(0)
print("\(floorLamp.title()): яркость \(floorLamp.brightness), включена: \(floorLamp.isOn)")

bedroomThermostat.turnOn()
print("\(bedroomThermostat.title()): температура \(bedroomThermostat.targetTemperature), включён: \(bedroomThermostat.isOn)")
```

## @output
```
Торшер (Гостиная): яркость 40, включена: true
Торшер (Гостиная): яркость 0, включена: false
Термостат (Спальня): температура 21, включён: true
```

## @tests
```swift
let __t_lamp = Lamp(name: "Бра", room: "Спальня", brightness: 55)
__ok("Lamp — наследник Device", (__t_lamp as Any) is Device, hint: "Объяви лампу так: class Lamp: Device")
__eq("Название лампы дошло до родителя", __t_lamp.name, "Бра", hint: "В init лампы вызови super.init(name: name, room: room)")
__eq("Комната лампы дошла до родителя", __t_lamp.room, "Спальня", hint: "В init лампы вызови super.init(name: name, room: room)")
__eq("Яркость сохраняется при создании", __t_lamp.brightness, 55, hint: "Перед вызовом super.init запиши параметр в свойство: self.brightness = brightness")
__eq("Новая лампа выключена", __t_lamp.isOn, false)
__eq("title() достался лампе от Device", __t_lamp.title(), "Бра (Спальня)")

__t_lamp.setBrightness(30)
__eq("setBrightness(30): яркость стала 30", __t_lamp.brightness, 30, hint: "Сначала запиши параметр метода в свойство brightness")
__eq("setBrightness(30) включает лампу", __t_lamp.isOn, true, hint: "Если новая яркость больше нуля, вызови turnOn()")
__t_lamp.setBrightness(0)
__eq("setBrightness(0): яркость стала 0", __t_lamp.brightness, 0, hint: "Яркость 0 тоже нужно записать в brightness")
__eq("setBrightness(0) выключает лампу", __t_lamp.isOn, false, hint: "Яркость 0 означает, что лампа не светит: вызови turnOff()")
__t_lamp.setBrightness(0)
__eq("Повторный setBrightness(0) оставляет лампу выключенной", __t_lamp.isOn, false, hint: "Метод не переключает лампу туда-обратно, а решает по значению яркости")
__t_lamp.setBrightness(1)
__eq("setBrightness(1): даже самая слабая яркость включает лампу", __t_lamp.isOn, true, hint: "Включать нужно при любой яркости больше нуля")
__t_lamp.setBrightness(100)
__eq("setBrightness(100): лампа по-прежнему включена", __t_lamp.isOn, true, hint: "Метод не переключает лампу туда-обратно, а решает по значению яркости")
__eq("setBrightness(100): яркость стала 100", __t_lamp.brightness, 100)

let __t_garland = Lamp(name: "Гирлянда", room: "Балкон", brightness: 60)
__t_garland.turnOn()
__eq("turnOn() достался лампе от Device", __t_garland.isOn, true)
__t_garland.setBrightness(0)
__eq("Включённая гирлянда гаснет после setBrightness(0)", __t_garland.isOn, false)
__eq("Яркость первой лампы не изменилась от действий со второй", __t_lamp.brightness, 100)

let __t_floor = Thermostat(name: "Тёплый пол", room: "Ванная", targetTemperature: 27)
__ok("Thermostat — наследник Device", (__t_floor as Any) is Device, hint: "Объяви термостат так: class Thermostat: Device")
__eq("Название термостата дошло до родителя", __t_floor.name, "Тёплый пол", hint: "В init термостата вызови super.init(name: name, room: room)")
__eq("Комната термостата дошла до родителя", __t_floor.room, "Ванная")
__eq("Температура сохраняется при создании", __t_floor.targetTemperature, 27, hint: "Перед вызовом super.init запиши параметр в свойство: self.targetTemperature = targetTemperature")
__eq("Новый термостат выключен", __t_floor.isOn, false)
__eq("title() достался термостату от Device", __t_floor.title(), "Тёплый пол (Ванная)")
__t_floor.turnOn()
__eq("turnOn() достался термостату от Device", __t_floor.isOn, true)
__t_floor.turnOff()
__eq("turnOff() достался термостату от Device", __t_floor.isOn, false)
```

## @rules
- must: /\bclass\s+Lamp\s*:\s*Device\b/ :: Лампа должна наследовать `Device`: объяви её так — `class Lamp: Device`.
- must: /\bclass\s+Thermostat\s*:\s*Device\b/ :: Термостат должен наследовать `Device`: объяви его так — `class Thermostat: Device`.
- must: /\bsuper\s*\.\s*init\s*\(/ :: В инициализаторе наследника нужно вызвать `super.init(name: name, room: room)` — так родитель заполнит свои свойства.

## @hint1
Начни с лампы. После её имени поставь двоеточие и имя родителя — `Device`. Сразу появятся ошибки: лампа объявляет заново то, что уже есть у родителя. Удали из неё свойства `name`, `room`, `isOn` и методы `turnOn()`, `turnOff()`, `title()`. Останутся только свойство `brightness` и инициализатор.

Теперь инициализатор. Записывать название и комнату через `self` лампа больше не может — эти свойства принадлежат родителю. Поэтому в `init` два шага: сначала запиши яркость в своё свойство, потом передай название и комнату родителю через `super.init`. Порядок именно такой: свои свойства, потом родитель.

Метод `setBrightness(_:)`: подчёркивание перед именем параметра означает, что метку при вызове не пишут. Внутри сначала запиши параметр в `brightness`. Потом одна развилка: если значение равно нулю, вызови `turnOff()`, иначе — `turnOn()`. Эти методы лампа получила от родителя, поэтому их можно вызывать прямо по имени.

С термостатом то же самое, что с лампой: двоеточие и родитель, удалить повторы, в `init` — своё свойство и `super.init`.

## @hint2
Так выглядит наследник со своим свойством и своим инициализатором:

```swift
class LeakSensor: Sensor {
    let maxHumidity: Int

    init(name: String, maxHumidity: Int) {
        self.maxHumidity = maxHumidity
        super.init(name: name)
    }
}
```

А так метод наследника пользуется тем, что досталось от родителя:

```swift
func setLevel(_ value: Int) {
    batteryLevel = value
    if value == 0 {
        // вызов метода родителя
    }
}
```

## @hint3
Класс `Device` и сценарий не меняются. Лампа и термостат после переделки — заполни пропуски:

```swift
class Lamp: ___ {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: ___, room: room)
    }

    func setBrightness(_ value: Int) {
        brightness = value
        if value == 0 {
            ___
        } else {
            turnOn()
        }
    }
}

class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        ___
    }
}
```

В первом пропуске — имя родителя. Во втором — параметр с названием. В третьем — вызов унаследованного метода, который гасит лампу. В четвёртом — вызов инициализатора родителя с названием и комнатой.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `class Lamp: Device` говорит: лампа — это устройство. Всё, что умеет `Device`, лампа получает без единой строчки: `name`, `room`, `isOn`, `turnOn()`, `turnOff()`, `title()`. В самой лампе осталось только то, чего у других устройств нет, — яркость. С термостатом так же: у него своё только `targetTemperature`.

**Почему init в два шага.** Объект лампы состоит из двух частей: родительской (название, комната, `isOn`) и своей (яркость). Свою часть лампа заполняет сама: `self.brightness = brightness`. Родительскую заполняет инициализатор родителя, его зовут через `super.init(name: name, room: room)`. Swift требует именно такой порядок: сначала свои свойства, потом родитель. Так ни одно свойство не останется без значения ни на мгновение.

**Как устроен `setBrightness`.** Метод записывает новую яркость, а потом вызывает `turnOff()` или `turnOn()`. Эти методы объявлены в `Device`, но для лампы они свои: она их унаследовала. Вызов получился без повторения логики — если однажды `turnOn()` в `Device` начнёт, например, писать журнал, лампа получит это бесплатно.

**Зачем всё это.** Общий код теперь живёт в одном месте. Когда появятся розетки и колонки, им тоже достаточно написать `: Device` и добавить только своё.

**Типичные ошибки:**

- двоеточие и `Device` добавлены, а повторы не удалены — Swift ответит ошибками со словом `override`: свойства `name`, `isOn` и методы вроде `turnOn()` уже есть у родителя;
- `super.init` вызван первым, до `self.brightness = brightness` — Swift напишет, что свойство не заполнено к моменту вызова родителя;
- в `init` лампы осталось `self.name = name` — это свойство родителя, его заполняет только `super.init`;
- `setBrightness` переключает лампу через `isOn = !isOn` — второй вызов с яркостью 100 выключит горящую лампу.
