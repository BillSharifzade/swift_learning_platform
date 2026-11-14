---
title: Центр управления
concept: Итог модуля — классы, наследование, полиморфизм, приведение типов
---

## @description

### Контекст
Финальная задача модуля. В «Гнезде» появляется главный экран — центр управления домом. Через него проходит всё: подключение новых устройств, сводка «что сейчас включено» и кнопка «Приглушить свет» для комнаты.

Тимлид собрал задачу из трёх частей: «Во-первых, у нас новое устройство — умная колонка, опиши её. Во-вторых, допиши класс `HomeHub`: он держит все устройства дома и умеет с ними работать. В-третьих, помни: устройства — объекты. Одна и та же лампа живёт и в хабе, и на экране комнаты. Хаб не должен подключать её дважды».

### Что пригодится
Нового в этой задаче нет. Вот инструменты модуля:

- **Наследование.** `class Speaker: Device` получает всё от родителя. Своё свойство заполняется в своём `init`, а потом вызывается `super.init(name:room:)`.
- **Переопределение.** `override func status() -> String` заменяет метод родителя. Внутри `super.status()` даёт родительский текст, к которому можно добавить своё.
- **Ссылки и `===`.** Две переменные могут вести к одному объекту. `===` отвечает, тот ли это самый объект, а не просто похожий. С методами массива из модуля про замыкания это записывается так: `items.contains(where: { $0 === item })`.
- **Полиморфизм.** В массиве `[Device]` лежат разные устройства, и `device.status()` у каждого вызывает его собственную версию.
- **Приведение типов.** `device as? Lamp` с `if let` даёт доступ к свойствам лампы, если это лампа. Наследники лампы — тоже лампы. Напомню, что в одном `if` можно перечислить несколько условий через запятую — и обычные, и с `let`.
- **Сортировка.** `sorted()` расставляет строки по алфавиту.

Напоминание о том, что хаб хранит не копии:

```swift
let hall = Lamp(name: "Лампа в прихожей", room: "Прихожая", brightness: 60)
let devices: [Device] = [hall]
if let lamp = devices[0] as? Lamp {
    lamp.brightness = 20
}
print(hall.brightness)    // 20 - в массиве лежит та же самая лампа
```

### Задача
Классы `Device`, `Lamp`, `Thermostat` и `SmartSocket` в редакторе готовы, их менять не нужно.

1. Объяви класс `Speaker` — наследника `Device`. Своё свойство — `volume` (`Int`, переменная), инициализатор `init(name:room:volume:)`. Переопредели `status()`: если колонка включена, к тексту родителя добавляются запятая, пробел, слово `громкость` и число — `Колонка: включено, громкость 30`. Если выключена — только текст родителя.
2. В `HomeHub` допиши метод `add(_:)`. Он принимает `Device` и возвращает `Bool`. Если этот же самый объект уже есть в `devices`, метод ничего не меняет и возвращает `false`. Иначе добавляет устройство в конец `devices` и возвращает `true`. Два разных объекта с одинаковым названием — это два разных устройства, оба подключаются.
3. Допиши метод `statusReport()`: возвращает `[String]` — строки `status()` всех устройств, отсортированные по алфавиту. Для пустого хаба — пустой массив.
4. Допиши метод `dimLights(in:to:)`: принимает название комнаты (`String`) и яркость (`Int`). Всем лампам в этой комнате он ставит эту яркость и возвращает `Int` — сколько ламп изменил. Другие устройства и лампы в других комнатах не трогает.

### Пример
```swift
let hub = HomeHub()
let desk = Lamp(name: "Лампа на столе", room: "Кабинет", brightness: 90)
hub.add(desk)                                // true
hub.add(desk)                                // false: это тот же объект
hub.dimLights(in: "Кабинет", to: 50)         // 1, и теперь desk.brightness == 50
hub.statusReport()                           // ["Лампа на столе: выключено"]
```

Сценарий из редактора должен вывести:

```text
Уже подключено: Торшер
Приглушено ламп: 2
Состояние дома:
Бра: выключено
Колонка: включено, громкость 30
Люстра: включено, яркость 30%
Розетка у чайника: выключено
Термостат: включено, температура 22
Торшер: включено, яркость 30%
```

## @starter
```swift
// Устройства «Гнезда». Эти классы менять не нужно
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

    func status() -> String {
        if isOn {
            return "\(name): включено"
        } else {
            return "\(name): выключено"
        }
    }
}

class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

    override func status() -> String {
        if isOn {
            return super.status() + ", яркость \(brightness)%"
        }
        return super.status()
    }
}

class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

    override func status() -> String {
        return super.status() + ", температура \(targetTemperature)"
    }
}

final class SmartSocket: Device {
}

// 1. Объяви здесь класс Speaker - наследника Device


// Центр управления домом
final class HomeHub {
    var devices: [Device] = []

    // 2. Подключает устройство. Тот же самый объект второй раз не подключается
    func add(_ device: Device) -> Bool {
        // Заглушка: замени её своим кодом
        return false
    }

    // 3. Строки состояния всех устройств по алфавиту
    func statusReport() -> [String] {
        // Заглушка: замени её своим кодом
        return []
    }

    // 4. Ставит всем лампам комнаты одну яркость и возвращает, сколько ламп изменилось
    func dimLights(in room: String, to brightness: Int) -> Int {
        // Заглушка: замени её своим кодом
        return 0
    }
}

// Сценарий: вечер в квартире. Этот код менять не нужно
let hub = HomeHub()

let floorLamp = Lamp(name: "Торшер", room: "Гостиная", brightness: 80)
let ceilingLamp = Lamp(name: "Люстра", room: "Гостиная", brightness: 100)
let bedsideLamp = Lamp(name: "Бра", room: "Спальня", brightness: 40)
let livingThermostat = Thermostat(name: "Термостат", room: "Гостиная", targetTemperature: 22)
let kitchenSpeaker = Speaker(name: "Колонка", room: "Кухня", volume: 30)
let kettleSocket = SmartSocket(name: "Розетка у чайника", room: "Кухня")

// Торшер случайно добавляют второй раз
let newDevices: [Device] = [floorLamp, ceilingLamp, bedsideLamp, livingThermostat, kitchenSpeaker, kettleSocket, floorLamp]
for device in newDevices {
    if !hub.add(device) {
        print("Уже подключено: \(device.name)")
    }
}

floorLamp.turnOn()
ceilingLamp.turnOn()
livingThermostat.turnOn()
kitchenSpeaker.turnOn()

print("Приглушено ламп: \(hub.dimLights(in: "Гостиная", to: 30))")
print("Состояние дома:")
for line in hub.statusReport() {
    print(line)
}
```

## @solution
```swift
// Устройства «Гнезда». Эти классы менять не нужно
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

    func status() -> String {
        if isOn {
            return "\(name): включено"
        } else {
            return "\(name): выключено"
        }
    }
}

class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

    override func status() -> String {
        if isOn {
            return super.status() + ", яркость \(brightness)%"
        }
        return super.status()
    }
}

class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

    override func status() -> String {
        return super.status() + ", температура \(targetTemperature)"
    }
}

final class SmartSocket: Device {
}

// 1. Объяви здесь класс Speaker - наследника Device
class Speaker: Device {
    var volume: Int

    init(name: String, room: String, volume: Int) {
        self.volume = volume
        super.init(name: name, room: room)
    }

    override func status() -> String {
        if isOn {
            return super.status() + ", громкость \(volume)"
        }
        return super.status()
    }
}

// Центр управления домом
final class HomeHub {
    var devices: [Device] = []

    // 2. Подключает устройство. Тот же самый объект второй раз не подключается
    func add(_ device: Device) -> Bool {
        if devices.contains(where: { $0 === device }) {
            return false
        }
        devices.append(device)
        return true
    }

    // 3. Строки состояния всех устройств по алфавиту
    func statusReport() -> [String] {
        return devices.map { $0.status() }.sorted()
    }

    // 4. Ставит всем лампам комнаты одну яркость и возвращает, сколько ламп изменилось
    func dimLights(in room: String, to brightness: Int) -> Int {
        var count = 0
        for device in devices {
            if device.room == room, let lamp = device as? Lamp {
                lamp.brightness = brightness
                count += 1
            }
        }
        return count
    }
}

// Сценарий: вечер в квартире. Этот код менять не нужно
let hub = HomeHub()

let floorLamp = Lamp(name: "Торшер", room: "Гостиная", brightness: 80)
let ceilingLamp = Lamp(name: "Люстра", room: "Гостиная", brightness: 100)
let bedsideLamp = Lamp(name: "Бра", room: "Спальня", brightness: 40)
let livingThermostat = Thermostat(name: "Термостат", room: "Гостиная", targetTemperature: 22)
let kitchenSpeaker = Speaker(name: "Колонка", room: "Кухня", volume: 30)
let kettleSocket = SmartSocket(name: "Розетка у чайника", room: "Кухня")

// Торшер случайно добавляют второй раз
let newDevices: [Device] = [floorLamp, ceilingLamp, bedsideLamp, livingThermostat, kitchenSpeaker, kettleSocket, floorLamp]
for device in newDevices {
    if !hub.add(device) {
        print("Уже подключено: \(device.name)")
    }
}

floorLamp.turnOn()
ceilingLamp.turnOn()
livingThermostat.turnOn()
kitchenSpeaker.turnOn()

print("Приглушено ламп: \(hub.dimLights(in: "Гостиная", to: 30))")
print("Состояние дома:")
for line in hub.statusReport() {
    print(line)
}
```

## @output
```
Уже подключено: Торшер
Приглушено ламп: 2
Состояние дома:
Бра: выключено
Колонка: включено, громкость 30
Люстра: включено, яркость 30%
Розетка у чайника: выключено
Термостат: включено, температура 22
Торшер: включено, яркость 30%
```

## @tests
```swift
// Устройства, которых в задаче нет: шторы со своим status() и цветная лампа-наследник
class __t_Curtains: Device {
    override func status() -> String {
        return "\(name): шторы открыты"
    }
}
class __t_ColorLamp: Lamp {}

let __t_speaker = Speaker(name: "Колонка в ванной", room: "Ванная", volume: 15)
__ok("Speaker — наследник Device", (__t_speaker as Any) is Device, hint: "Объяви колонку так: class Speaker: Device")
__eq("Колонка: название дошло до родителя", __t_speaker.name, "Колонка в ванной", hint: "В init колонки вызови super.init(name: name, room: room)")
__eq("Колонка: комната дошла до родителя", __t_speaker.room, "Ванная")
__eq("Колонка: громкость сохраняется", __t_speaker.volume, 15)
__eq("Выключенная колонка: только текст родителя", __t_speaker.status(), "Колонка в ванной: выключено", hint: "Пока колонка выключена, громкость не показывается: верни super.status()")
__t_speaker.turnOn()
__eq("Включённая колонка с громкостью 15", __t_speaker.status(), "Колонка в ванной: включено, громкость 15", hint: "К super.status() добавь запятую, пробел, слово громкость и число")
__t_speaker.volume = 0
__eq("Громкость берётся из свойства: теперь 0", __t_speaker.status(), "Колонка в ванной: включено, громкость 0")

let __t_hub = HomeHub()
__eq("Пустой хаб: отчёт пустой", __t_hub.statusReport(), [], hint: "Если устройств нет, statusReport() возвращает пустой массив")
__eq("Пустой хаб: приглушать нечего", __t_hub.dimLights(in: "Спальня", to: 10), 0)

let __t_bedside = Lamp(name: "Ночник", room: "Спальня", brightness: 50)
__eq("Новое устройство подключается: true", __t_hub.add(__t_bedside), true, hint: "Если такого объекта ещё нет в devices, добавь его и верни true")
__eq("Тот же объект второй раз: false", __t_hub.add(__t_bedside), false, hint: "Проверь, есть ли в devices этот же объект: devices.contains(where: { $0 === device })")
__eq("После повторного add устройство в хабе одно", __t_hub.devices.count, 1, hint: "Если объект уже подключён, devices не меняется")
let __t_alias: Device = __t_bedside
__eq("Та же лампа через другую переменную: false", __t_hub.add(__t_alias), false, hint: "Другая переменная, но объект тот же — сравнивай ссылки через ===")
let __t_twin = Lamp(name: "Ночник", room: "Спальня", brightness: 50)
__eq("Другая лампа с тем же названием: true", __t_hub.add(__t_twin), true, hint: "Сравнивай не названия, а сами объекты через ===: две одинаковые лампы — это два устройства")
__ok("Устройства добавляются в конец по порядку", __t_hub.devices.count == 2 && __t_hub.devices[0] === __t_bedside && __t_hub.devices[1] === __t_twin, hint: "Новое устройство добавляется в конец devices через append")

let __t_curtains = __t_Curtains(name: "Шторы", room: "Спальня")
let __t_color = __t_ColorLamp(name: "Лента", room: "Спальня", brightness: 70)
let __t_heat = Thermostat(name: "Батарея", room: "Спальня", targetTemperature: 21)
let __t_hallLamp = Lamp(name: "Лампа в прихожей", room: "Прихожая", brightness: 90)
for __t_d in [__t_curtains, __t_color, __t_heat, __t_hallLamp, __t_speaker] as [Device] {
    _ = __t_hub.add(__t_d)
}
__t_heat.turnOn()

__eq("dimLights: три лампы в спальне, включая наследника", __t_hub.dimLights(in: "Спальня", to: 25), 3, hint: "Считай каждую лампу этой комнаты: проверка as? Lamp срабатывает и для наследников лампы")
__eq("dimLights: ночник получил 25", __t_bedside.brightness, 25, hint: "Разверни устройство через as? Lamp и запиши яркость в lamp.brightness")
__eq("dimLights: второй ночник тоже 25", __t_twin.brightness, 25)
__eq("dimLights: цветная лента тоже 25", __t_color.brightness, 25, hint: "Наследник лампы — тоже лампа")
__eq("dimLights: лампа в прихожей не тронута", __t_hallLamp.brightness, 90, hint: "Менять нужно только лампы из указанной комнаты: проверь device.room")
__eq("dimLights: термостат в спальне не тронут", __t_heat.targetTemperature, 21)
__eq("dimLights: в ванной ламп нет", __t_hub.dimLights(in: "Ванная", to: 5), 0, hint: "Колонка в ванной — не лампа, её не считают")
__eq("dimLights: незнакомая комната", __t_hub.dimLights(in: "Чердак", to: 5), 0)
__eq("dimLights: одна лампа в прихожей", __t_hub.dimLights(in: "Прихожая", to: 0), 1)
__eq("dimLights в прихожей сработал", __t_hallLamp.brightness, 0)

__eq("statusReport: все устройства по алфавиту, каждое своим текстом", __t_hub.statusReport(), ["Батарея: включено, температура 21", "Колонка в ванной: включено, громкость 0", "Лампа в прихожей: выключено", "Лента: выключено", "Ночник: выключено", "Ночник: выключено", "Шторы: шторы открыты"], hint: "Вызови status() у каждого устройства и отсортируй строки через sorted()")
__t_color.turnOn()
__eq("statusReport показывает текущее состояние объектов", __t_hub.statusReport().contains("Лента: включено, яркость 25%"), true, hint: "Отчёт собирается заново при каждом вызове из status() устройств")
```

## @rules
- must: /===/ :: В `add` сравни объекты оператором `===`: важно, тот ли это самый объект, а не похожий.
- mustnot: /\bas!/ :: Не используй `as!` — оно роняет приложение, если тип не тот. Подойдёт `as?` с `if let`.

## @hint1
Начни с колонки — без неё сценарий не соберётся. Она устроена как лампа: двоеточие и родитель после имени, своё свойство громкости, инициализатор, который сначала заполняет громкость, а потом зовёт инициализатор родителя. И переопределённый `status()` с развилкой по `isOn`: родительский текст плюс громкость или просто родительский текст.

`add(_:)`: сначала спроси массив, нет ли в нём этого же объекта. Вопрос «есть ли элемент, для которого условие верно» задаёт `contains(where:)`, а условие — сравнение ссылок оператором из трёх знаков равно. Если есть — верни `false`. Иначе добавь устройство в конец и верни `true`.

`statusReport()`: преврати каждое устройство в его строку состояния через `map`, потом отсортируй. Какую версию `status()` вызвать, Swift решит сам.

`dimLights(in:to:)`: заведи счётчик. Пройди по устройствам циклом. Внутри одно `if` с двумя условиями через запятую: устройство в нужной комнате, и его удалось развернуть как лампу через `as?`. Если оба выполнены — поставь яркость и увеличь счётчик. В конце верни счётчик.

## @hint2
Ключевые фрагменты на другом примере:

```swift
// есть ли в массиве тот же самый объект
if cameras.contains(where: { $0 === camera }) {
    return false
}

// разные версии метода и сортировка
let lines = sensors.map { $0.selfTest() }.sorted()

// только нужная комната и только нужный тип
for sensor in sensors {
    if sensor.room == room, let water = sensor as? WaterSensor {
        water.isArmed = true
    }
}
```

## @hint3
Колонка готова, в хабе остались пропуски:

```swift
class Speaker: Device {
    var volume: Int

    init(name: String, room: String, volume: Int) {
        self.volume = volume
        super.init(name: name, room: room)
    }

    override func status() -> String {
        if isOn {
            return super.status() + ", громкость \(volume)"
        }
        return super.status()
    }
}

final class HomeHub {
    var devices: [Device] = []

    func add(_ device: Device) -> Bool {
        if devices.contains(where: { $0 ___ device }) {
            return false
        }
        devices.append(device)
        return ___
    }

    func statusReport() -> [String] {
        return devices.map { $0.status() }.___()
    }

    func dimLights(in room: String, to brightness: Int) -> Int {
        var count = 0
        for device in devices {
            if device.room == room, let lamp = device ___ Lamp {
                lamp.brightness = brightness
                count += 1
            }
        }
        return count
    }
}
```

По порядку: оператор «тот же самый объект»; что вернуть, когда устройство подключено; метод сортировки; оператор безопасного приведения.

## @hint4
Вот готовое решение:

{{solution}}

**Колонка.** `Speaker` наследует от `Device` название, комнату, `isOn` и методы. Своё у неё — громкость: её заполняет свой `init`, а родительскую часть — `super.init`. В `status()` колонка не повторяет формат «название: состояние», а берёт его у родителя через `super.status()`.

**`add` и `===`.** Хаб хранит не копии устройств, а ссылки на те же объекты, что живут в сценарии. Поэтому вопрос «уже подключено?» — это вопрос «тот же ли это объект?», и ответ на него даёт `===`. Сравнение названий здесь не годится: два одинаковых ночника в спальне — два разных устройства, а торшер, добавленный второй раз, — то же самое.

**`statusReport` и полиморфизм.** `map { $0.status() }` вызывает у каждого устройства его собственную версию: у ламп — с яркостью, у колонки — с громкостью, у розетки — родительскую. Проверка подложила хабу шторы, которых в задаче нет, — и они попали в отчёт своим текстом.

**`dimLights` и приведение.** В условии `if` два шага через запятую, как ты делала с `if let` в «Рядом»: `device.room == room` отсекает чужие комнаты, `as? Lamp` — всё, что не лампа. Второй шаг выполняется, только если первый прошёл. Изменение `lamp.brightness` меняет настоящий объект: после вызова торшер в сценарии светит на 30%, хотя его переменную никто не трогал.

**Типичные ошибки:**

- в `add` сравниваются названия — второй ночник не подключится;
- `devices.contains(device)` без `where` — `Device` не умеет сравниваться через `==`, и Swift не соберёт код;
- в `dimLights` счётчик растёт для каждого устройства комнаты, а не только для ламп;
- отчёт не отсортирован — строки идут в порядке подключения.
