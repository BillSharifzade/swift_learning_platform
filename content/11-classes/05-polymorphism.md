---
title: Сценарий «Ухожу из дома»
concept: Полиморфизм — один вызов, разное поведение
---

## @description

### Контекст
Главная кнопка «Гнезда» — «Ухожу из дома». Одно нажатие в прихожей — и квартира сама готовится к пустоте: свет гаснет, чайник обесточен, термостат переходит в экономный режим. А вот холодильник выключать нельзя — его розетка остаётся под напряжением.

Продакт-менеджер описал, что должно получиться: после нажатия экран показывает отчёт, по строке на каждое устройство, а ниже — список того, что осталось включённым. Тимлид добавляет: «Устройства лежат в одном массиве `[Device]`. Не надо выяснять, кто там лампа, а кто термостат. Каждый класс сам знает, как ему готовиться к уходу. Сценарию достаточно попросить об этом каждого».

### Новое в Swift
**Наследник может стоять там, где ждут родителя.** Датчик протечки — это датчик. Поэтому его можно положить в переменную типа `Sensor` или в массив `[Sensor]` вместе с другими наследниками:

```swift
class Sensor {
    let name: String

    init(name: String) {
        self.name = name
    }

    func selfTest() -> String {
        return "\(name): связь есть"
    }
}

class WaterSensor: Sensor {
    override func selfTest() -> String {
        return "\(name): связь есть, контакты сухие"
    }
}

class SmokeSensor: Sensor {
    override func selfTest() -> String {
        return "\(name): связь есть, сирена проверена"
    }
}

let sensors: [Sensor] = [
    WaterSensor(name: "Ванная"),
    Sensor(name: "Окно на кухне"),
    SmokeSensor(name: "Коридор")
]
```

**Вызывается версия настоящего объекта.** Тип элементов массива — `Sensor`. Но в ячейках лежат разные объекты, и каждый отвечает по-своему:

```swift
for sensor in sensors {
    print(sensor.selfTest())
}
// Ванная: связь есть, контакты сухие
// Окно на кухне: связь есть
// Коридор: связь есть, сирена проверена
```

В цикле нет ни одного `if`. Swift в момент вызова смотрит, какой объект лежит в переменной на самом деле, и запускает его версию метода. Если у наследника своей версии нет, работает родительская. Это и называется **полиморфизмом** — «много форм»: один и тот же вызов, а поведение разное.

**Функция для родителя подходит всем наследникам.** Параметр типа `Sensor` или `[Sensor]` принимает любой датчик — и тот, что появится через год. Новому классу достаточно унаследовать `Sensor` и переопределить метод. Цикл менять не придётся.

> 💡 Через переменную типа `Sensor` видно только то, что есть у самого `Sensor`: `name` и `selfTest()`. Своих свойств наследника отсюда не достать. Как узнать настоящий тип объекта и добраться до них — в следующей задаче.

### Задача
В редакторе уже есть `Device` с методом `prepareForLeaving() -> String`. Родительская версия выключает устройство и возвращает `Торшер: выключено`. Лампы её не меняют. Класс `Device` и лампу не трогай.

1. **Термостат** переопределяет `prepareForLeaving()`. Он не выключается, а переходит в эко-режим: если `targetTemperature` выше `18`, она становится `18`; если `18` или ниже — не меняется. Метод возвращает название, двоеточие и `эко-режим, температура` с числом: `Термостат: эко-режим, температура 18`.
2. **Розетка** переопределяет `prepareForLeaving()`. Если её свойство `isAlwaysOn` равно `true`, розетку не трогают, а метод возвращает `Розетка холодильника: не отключается`. Иначе она ведёт себя как любое устройство: верни результат `super.prepareForLeaving()`.
3. Функция `leaveHome(_:)` принимает `[Device]` и возвращает `[String]`: вызывает `prepareForLeaving()` у каждого устройства и собирает строки отчёта в том же порядке.
4. Функция `namesStillOn(_:)` принимает `[Device]` и возвращает `[String]` — названия устройств, у которых `isOn` равно `true`, в том же порядке.

### Пример
```swift
let study = Thermostat(name: "Термостат в кабинете", room: "Кабинет", targetTemperature: 16)
let router = SmartSocket(name: "Розетка роутера", room: "Прихожая", isAlwaysOn: true)
router.turnOn()
leaveHome([study, router])
// ["Термостат в кабинете: эко-режим, температура 16", "Розетка роутера: не отключается"]
namesStillOn([study, router])
// ["Розетка роутера"] - термостат и не был включён
```

Сценарий из редактора должен вывести:

```text
Ухожу из дома:
Торшер: выключено
Термостат: эко-режим, температура 18
Розетка холодильника: не отключается
Розетка у чайника: выключено
Бра: выключено
Остались включёнными:
- Термостат
- Розетка холодильника
```

## @starter
```swift
// Общий родитель устройств. Этот класс менять не нужно
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

    // Как устройство готовится к уходу из дома. Обычно - просто выключается
    func prepareForLeaving() -> String {
        turnOff()
        return "\(name): выключено"
    }
}

// Лампа готовится к уходу как любое устройство. Её менять не нужно
class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }
}

// 1. Термостат: эко-режим вместо выключения
class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

}

// 2. Розетка: та, что isAlwaysOn, не отключается
final class SmartSocket: Device {
    let isAlwaysOn: Bool

    init(name: String, room: String, isAlwaysOn: Bool) {
        self.isAlwaysOn = isAlwaysOn
        super.init(name: name, room: room)
    }

}

// 3. Готовит к уходу каждое устройство и возвращает строки отчёта
func leaveHome(_ devices: [Device]) -> [String] {
    // Заглушка: замени её своим кодом
    return []
}

// 4. Названия устройств, которые сейчас включены
func namesStillOn(_ devices: [Device]) -> [String] {
    // Заглушка: замени её своим кодом
    return []
}

// Сценарий: вечер, всё включено, все уходят из дома. Этот код менять не нужно
let home: [Device] = [
    Lamp(name: "Торшер", room: "Гостиная", brightness: 70),
    Thermostat(name: "Термостат", room: "Гостиная", targetTemperature: 23),
    SmartSocket(name: "Розетка холодильника", room: "Кухня", isAlwaysOn: true),
    SmartSocket(name: "Розетка у чайника", room: "Кухня", isAlwaysOn: false),
    Lamp(name: "Бра", room: "Спальня", brightness: 40)
]
for device in home {
    device.turnOn()
}

print("Ухожу из дома:")
for line in leaveHome(home) {
    print(line)
}
print("Остались включёнными:")
for name in namesStillOn(home) {
    print("- \(name)")
}
```

## @solution
```swift
// Общий родитель устройств. Этот класс менять не нужно
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

    // Как устройство готовится к уходу из дома. Обычно - просто выключается
    func prepareForLeaving() -> String {
        turnOff()
        return "\(name): выключено"
    }
}

// Лампа готовится к уходу как любое устройство. Её менять не нужно
class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }
}

// 1. Термостат: эко-режим вместо выключения
class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

    override func prepareForLeaving() -> String {
        if targetTemperature > 18 {
            targetTemperature = 18
        }
        return "\(name): эко-режим, температура \(targetTemperature)"
    }
}

// 2. Розетка: та, что isAlwaysOn, не отключается
final class SmartSocket: Device {
    let isAlwaysOn: Bool

    init(name: String, room: String, isAlwaysOn: Bool) {
        self.isAlwaysOn = isAlwaysOn
        super.init(name: name, room: room)
    }

    override func prepareForLeaving() -> String {
        if isAlwaysOn {
            return "\(name): не отключается"
        }
        return super.prepareForLeaving()
    }
}

// 3. Готовит к уходу каждое устройство и возвращает строки отчёта
func leaveHome(_ devices: [Device]) -> [String] {
    var report: [String] = []
    for device in devices {
        report.append(device.prepareForLeaving())
    }
    return report
}

// 4. Названия устройств, которые сейчас включены
func namesStillOn(_ devices: [Device]) -> [String] {
    return devices.filter { $0.isOn }.map { $0.name }
}

// Сценарий: вечер, всё включено, все уходят из дома. Этот код менять не нужно
let home: [Device] = [
    Lamp(name: "Торшер", room: "Гостиная", brightness: 70),
    Thermostat(name: "Термостат", room: "Гостиная", targetTemperature: 23),
    SmartSocket(name: "Розетка холодильника", room: "Кухня", isAlwaysOn: true),
    SmartSocket(name: "Розетка у чайника", room: "Кухня", isAlwaysOn: false),
    Lamp(name: "Бра", room: "Спальня", brightness: 40)
]
for device in home {
    device.turnOn()
}

print("Ухожу из дома:")
for line in leaveHome(home) {
    print(line)
}
print("Остались включёнными:")
for name in namesStillOn(home) {
    print("- \(name)")
}
```

## @output
```
Ухожу из дома:
Торшер: выключено
Термостат: эко-режим, температура 18
Розетка холодильника: не отключается
Розетка у чайника: выключено
Бра: выключено
Остались включёнными:
- Термостат
- Розетка холодильника
```

## @tests
```swift
// Устройство, которого в задаче нет: проверка, что сценарий работает и с будущими классами
class __t_Curtains: Device {
    var calls = 0
    override func prepareForLeaving() -> String {
        calls += 1
        return "\(name): шторы закрыты"
    }
}
class __t_Kettle: Device {}

__eq("Пустой дом: отчёт пустой", leaveHome([]), [], hint: "Для пустого массива функция возвращает пустой массив")
__eq("Пустой дом: включённых нет", namesStillOn([]), [])

let __t_warm = Thermostat(name: "Термостат в детской", room: "Детская", targetTemperature: 25)
__eq("Термостат с 25 градусами: строка отчёта", __t_warm.prepareForLeaving(), "Термостат в детской: эко-режим, температура 18", hint: "Если температура выше 18, сначала поставь 18, потом собери строку из свойства targetTemperature")
__eq("Термостат с 25 градусами: температура стала 18", __t_warm.targetTemperature, 18)
let __t_exact = Thermostat(name: "Термостат в ванной", room: "Ванная", targetTemperature: 18)
__t_exact.turnOn()
__eq("Термостат ровно с 18 градусами: строка отчёта", __t_exact.prepareForLeaving(), "Термостат в ванной: эко-режим, температура 18")
__eq("Термостат не выключается при уходе", __t_exact.isOn, true, hint: "Термостат не вызывает turnOff() — он только меняет температуру")
let __t_cold = Thermostat(name: "Термостат на балконе", room: "Балкон", targetTemperature: 15)
__eq("Термостат с 15 градусами: температура не поднимается", __t_cold.prepareForLeaving(), "Термостат на балконе: эко-режим, температура 15", hint: "Эко-режим только снижает температуру: если она 18 или ниже, её не трогают")
__eq("Термостат с 15 градусами: в свойстве по-прежнему 15", __t_cold.targetTemperature, 15, hint: "Эко-режим только снижает температуру: если она 18 или ниже, её не трогают")

let __t_fridge = SmartSocket(name: "Розетка морозилки", room: "Кладовая", isAlwaysOn: true)
__t_fridge.turnOn()
__eq("Розетка, которая всегда включена: строка отчёта", __t_fridge.prepareForLeaving(), "Розетка морозилки: не отключается", hint: "Если isAlwaysOn равно true, верни название, двоеточие и не отключается")
__eq("Розетка, которая всегда включена, остаётся включённой", __t_fridge.isOn, true, hint: "Такую розетку не трогают: turnOff() для неё не вызывается")
let __t_iron = SmartSocket(name: "Розетка утюга", room: "Спальня", isAlwaysOn: false)
__t_iron.turnOn()
__eq("Обычная розетка: строка отчёта как у любого устройства", __t_iron.prepareForLeaving(), "Розетка утюга: выключено", hint: "Для обычной розетки верни super.prepareForLeaving()")
__eq("Обычная розетка выключается", __t_iron.isOn, false, hint: "Для обычной розетки верни super.prepareForLeaving() — родитель сам её выключит")

let __t_curtains = __t_Curtains(name: "Шторы", room: "Гостиная")
let __t_kettle = __t_Kettle(name: "Чайник", room: "Кухня")
let __t_lamp = Lamp(name: "Ночник", room: "Детская", brightness: 10)
let __t_heat = Thermostat(name: "Тёплый пол", room: "Ванная", targetTemperature: 28)
let __t_router = SmartSocket(name: "Розетка роутера", room: "Прихожая", isAlwaysOn: true)
let __t_home: [Device] = [__t_curtains, __t_lamp, __t_router, __t_heat, __t_kettle]
for __t_d in __t_home { __t_d.turnOn() }
__eq("Смешанный дом: отчёт по каждому устройству в исходном порядке", leaveHome(__t_home), ["Шторы: шторы закрыты", "Ночник: выключено", "Розетка роутера: не отключается", "Тёплый пол: эко-режим, температура 18", "Чайник: выключено"], hint: "Вызови prepareForLeaving() у каждого устройства по очереди — Swift сам выберет нужную версию. Не проверяй типы и не пиши тексты в функции")
__eq("leaveHome вызывает prepareForLeaving ровно один раз для каждого", __t_curtains.calls, 1, hint: "В цикле один вызов prepareForLeaving() на устройство, и его результат сразу идёт в отчёт")
__eq("После сценария включены шторы, розетка роутера и тёплый пол", namesStillOn(__t_home), ["Шторы", "Розетка роутера", "Тёплый пол"], hint: "Нужны названия устройств с isOn == true в исходном порядке")
__eq("Сценарий выключил лампу", __t_lamp.isOn, false)

let __t_off = Lamp(name: "Лампа в кладовой", room: "Кладовая", brightness: 50)
let __t_on = Lamp(name: "Лампа в прихожей", room: "Прихожая", brightness: 50)
__t_on.turnOn()
__eq("namesStillOn: только включённые", namesStillOn([__t_off, __t_on, __t_off]), ["Лампа в прихожей"], hint: "Выключенные устройства в список не попадают")
__eq("namesStillOn: ни одного включённого", namesStillOn([__t_off]), [])
```

## @rules
- must: /\bsuper\s*\.\s*prepareForLeaving\s*\(\s*\)/ :: Обычная розетка готовится к уходу как любое устройство — верни `super.prepareForLeaving()`, а не повторяй код родителя.

## @hint1
Начни с термостата. Внутри класса, после инициализатора, переопредели метод `prepareForLeaving()` — то же имя и тот же тип результата, что у родителя, и слово «переопределяю» впереди. В методе сначала развилка: если температура выше 18, присвой ей 18. Ветка «иначе» не нужна. Потом верни строку, где число вставлено из свойства температуры — после развилки там уже правильное значение.

Розетка: тоже переопредели метод. Если `isAlwaysOn` — верни строку «не отключается» и ничего не выключай. Иначе верни то, что вернёт родительская версия, — её вызывают через `super`.

Функция `leaveHome(_:)`: заведи пустой массив строк, пройди циклом по устройствам и добавляй в массив результат вызова метода у каждого. Тип устройства выяснять не нужно — Swift сам выберет нужную версию метода. В конце верни массив.

Функция `namesStillOn(_:)`: отбери включённые устройства и превращай каждое в его название. Подойдут `filter` и `map` из модуля про замыкания, а можно и циклом.

## @hint2
Переопределение с условием и вызовом родителя выглядит так:

```swift
override func selfTest() -> String {
    if isMuted {
        return "\(name): звук выключен"
    }
    return super.selfTest()
}
```

А так один вызов работает для любых наследников:

```swift
var lines: [String] = []
for sensor in sensors {
    lines.append(sensor.selfTest())
}
```

## @hint3
Методы термостата и розетки, функции — заполни пропуски:

```swift
    // в классе Thermostat
    override func prepareForLeaving() -> String {
        if targetTemperature > 18 {
            targetTemperature = ___
        }
        return "\(name): эко-режим, температура \(targetTemperature)"
    }

    // в классе SmartSocket
    override func prepareForLeaving() -> String {
        if isAlwaysOn {
            return "\(name): не отключается"
        }
        return ___
    }

func leaveHome(_ devices: [Device]) -> [String] {
    var report: [String] = []
    for device in devices {
        report.append(___)
    }
    return report
}

func namesStillOn(_ devices: [Device]) -> [String] {
    return devices.filter { ___ }.map { $0.name }
}
```

По порядку: температура эко-режима; вызов родительской версии метода; вызов метода у очередного устройства; условие «устройство включено».

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** В массиве `home` лежат лампы, термостат и розетки, но тип массива — `[Device]`. В `leaveHome` цикл вызывает `device.prepareForLeaving()` у каждого элемента. Swift смотрит, какой объект в ячейке на самом деле, и запускает его версию: у термостата — эко-режим, у розеток — свою с проверкой `isAlwaysOn`, у ламп — родительскую из `Device`, потому что своей у них нет.

**Почему в `leaveHome` нет ни одного `if`.** Решение «что делать при уходе» живёт в самих классах. Сценарию не нужно знать, какие бывают устройства. Когда появятся шторы или робот-пылесос, они переопределят `prepareForLeaving()`, и `leaveHome` заработает с ними без единой правки. Именно так проверка и испытала твою функцию: подсунула ей класс штор, которого в задаче нет.

**Термостат.** `if targetTemperature > 18` снижает только высокую температуру. Строка собирается после развилки, поэтому в ней всегда актуальное число. Слово `turnOff()` в методе не встречается — термостат при уходе остаётся включённым.

**Розетка.** Для обычной розетки `super.prepareForLeaving()` делает всё, что делает любое устройство: выключает и возвращает «выключено». Повторять этот код в розетке не нужно.

**Типичные ошибки:**

- в `leaveHome` метод вызван дважды — один раз «просто так», второй для отчёта: шторы закроются дважды, а у других устройств может сломаться логика;
- термостат всегда получает 18 — тогда холодный балкон при уходе начнут нагревать;
- в розетке для обычного случая написано `turnOff()` и строка вручную — работает, но дублирует родителя;
- в `namesStillOn` перепутаны `filter` и `map` местами — после `map` останутся строки, у которых нет `isOn`.
