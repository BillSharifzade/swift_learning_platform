---
title: Своё поведение
concept: override, super, final, свойства типа class
---

## @description

### Контекст
В списке устройств под каждым названием есть строка состояния. Сейчас её собирает метод `status()` класса `Device`, и у всех устройств она одинаковая: `Торшер: включено`.

Дизайнер просит больше подробностей: у горящей лампы показывать яркость, у термостата — температуру. Тимлид добавляет: «Писать `status()` заново целиком не нужно. Пусть лампа и термостат возьмут родительский текст и допишут своё. И ещё два пункта. Экрану "Добавить устройство" нужны названия типов: "Лампа", "Термостат", "Розетка". А розетку пометь как `final`: у нас правило — классы, от которых никто не наследуется, закрываем».

### Новое в Swift
**`override` — своя версия метода.** Наследник получает методы родителя как есть. Но он может заменить любой из них своей версией. Для этого перед `func` пишут слово `override` — «переопределяю»:

```swift
class Sensor {
    let name: String
    var batteryLevel = 100

    init(name: String) {
        self.name = name
    }

    func report() -> String {
        return "\(name): заряд \(batteryLevel)%"
    }
}

class WaterSensor: Sensor {
    var isWet = false

    override func report() -> String {
        return isWet ? "\(name): протечка" : "\(name): сухо"
    }
}
```

Теперь у датчика протечки `report()` свой, а у обычного датчика — прежний. Слово `override` обязательно. Без него Swift решит, что ты случайно назвала новый метод так же, как родительский, и не соберёт код. А если написать `override` перед методом, которого у родителя нет, Swift тоже сообщит об ошибке.

**`super` — позвать версию родителя.** Часто старое поведение нужно не выбросить, а дополнить. Внутри метода `super.report()` вызывает родительскую версию:

```swift
override func report() -> String {
    return super.report() + ", протечки нет"
}
// "Ванная: заряд 90%, протечки нет"
```

Так общая часть текста живёт только у родителя. Поменяется формат у него — поменяется и у всех наследников.

**`final` — дальше менять нельзя.** Слово `final` перед `class` запрещает наследоваться от класса. Перед методом — запрещает его переопределять:

```swift
final class SmokeSensor: Sensor {
}
// class KitchenSmokeSensor: SmokeSensor {}   - ошибка: класс final
```

**Свойства типа: `static` и `class`.** Свойство `static` ты знаешь по «Уюту»: оно принадлежит самому типу, а не объекту. В классах оно работает так же, но наследник не может его заменить. Если заменить нужно, вместо `static` пишут `class`. Такое свойство бывает только вычисляемым:

```swift
class Sensor {
    class var catalogTitle: String {
        return "Датчик"
    }
}

class WaterSensor: Sensor {
    override class var catalogTitle: String {
        return "Датчик протечки"
    }
}

print(Sensor.catalogTitle)        // Датчик
print(WaterSensor.catalogTitle)   // Датчик протечки
```

Название типа нужно ещё до того, как создан хоть один объект: экран каталога показывает, что можно добавить. Поэтому это свойство типа, а не объекта.

### Задача
Класс `Device` в редакторе менять не нужно. Его метод `status()` возвращает название, двоеточие и `включено` или `выключено`. Свойство типа `catalogTitle` у него равно `"Устройство"`.

1. В `Lamp` переопредели `status()`. Если лампа включена, к тексту родителя добавляются запятая, пробел, слово `яркость`, число и знак процента: `Торшер: включено, яркость 70%`. Если выключена — текст родителя без изменений: `Торшер: выключено`.
2. В `Thermostat` переопредели `status()`. К тексту родителя всегда добавляются запятая, пробел, слово `температура` и число: `Термостат: выключено, температура 21`.
3. В обоих методах текст родителя получай вызовом `super.status()`, а не пиши заново.
4. Переопредели `catalogTitle`: у `Lamp` — `"Лампа"`, у `Thermostat` — `"Термостат"`. У розетки это уже сделано — посмотри, как.
5. Пометь класс `SmartSocket` словом `final`.

### Пример
```swift
let night = Lamp(name: "Ночник", room: "Детская", brightness: 15)
night.status()          // "Ночник: выключено"
night.turnOn()
night.status()          // "Ночник: включено, яркость 15%"
Thermostat.catalogTitle // "Термостат"
```

Сценарий из редактора должен вывести:

```text
Каталог: Лампа, Термостат, Розетка
Торшер: выключено
Торшер: включено, яркость 70%
Термостат в спальне: выключено, температура 21
Розетка у чайника: включено
```

## @starter
```swift
// Общий родитель устройств. Этот класс менять не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    // Название типа для экрана "Добавить устройство"
    class var catalogTitle: String {
        return "Устройство"
    }

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

    // Строка состояния для списка устройств
    func status() -> String {
        if isOn {
            return "\(name): включено"
        } else {
            return "\(name): выключено"
        }
    }
}

// 1. Лампа: своя строка состояния (с яркостью, если горит) и своё название в каталоге
class Lamp: Device {
    var brightness: Int

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

}

// 2. Термостат: своя строка состояния (всегда с температурой) и своё название в каталоге
class Thermostat: Device {
    var targetTemperature: Int

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

}

// 3. Розетка. От неё никто не наследуется - пометь класс как final
class SmartSocket: Device {
    override class var catalogTitle: String {
        return "Розетка"
    }
}

// Сценарий: каталог и список устройств. Этот код менять не нужно
print("Каталог: \(Lamp.catalogTitle), \(Thermostat.catalogTitle), \(SmartSocket.catalogTitle)")

let floorLamp = Lamp(name: "Торшер", room: "Гостиная", brightness: 70)
let bedroomThermostat = Thermostat(name: "Термостат в спальне", room: "Спальня", targetTemperature: 21)
let kettleSocket = SmartSocket(name: "Розетка у чайника", room: "Кухня")

print(floorLamp.status())
floorLamp.turnOn()
print(floorLamp.status())
print(bedroomThermostat.status())
kettleSocket.turnOn()
print(kettleSocket.status())
```

## @solution
```swift
// Общий родитель устройств. Этот класс менять не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    // Название типа для экрана "Добавить устройство"
    class var catalogTitle: String {
        return "Устройство"
    }

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

    // Строка состояния для списка устройств
    func status() -> String {
        if isOn {
            return "\(name): включено"
        } else {
            return "\(name): выключено"
        }
    }
}

// 1. Лампа: своя строка состояния (с яркостью, если горит) и своё название в каталоге
class Lamp: Device {
    var brightness: Int

    override class var catalogTitle: String {
        return "Лампа"
    }

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

// 2. Термостат: своя строка состояния (всегда с температурой) и своё название в каталоге
class Thermostat: Device {
    var targetTemperature: Int

    override class var catalogTitle: String {
        return "Термостат"
    }

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

    override func status() -> String {
        return super.status() + ", температура \(targetTemperature)"
    }
}

// 3. Розетка. От неё никто не наследуется - пометь класс как final
final class SmartSocket: Device {
    override class var catalogTitle: String {
        return "Розетка"
    }
}

// Сценарий: каталог и список устройств. Этот код менять не нужно
print("Каталог: \(Lamp.catalogTitle), \(Thermostat.catalogTitle), \(SmartSocket.catalogTitle)")

let floorLamp = Lamp(name: "Торшер", room: "Гостиная", brightness: 70)
let bedroomThermostat = Thermostat(name: "Термостат в спальне", room: "Спальня", targetTemperature: 21)
let kettleSocket = SmartSocket(name: "Розетка у чайника", room: "Кухня")

print(floorLamp.status())
floorLamp.turnOn()
print(floorLamp.status())
print(bedroomThermostat.status())
kettleSocket.turnOn()
print(kettleSocket.status())
```

## @output
```
Каталог: Лампа, Термостат, Розетка
Торшер: выключено
Торшер: включено, яркость 70%
Термостат в спальне: выключено, температура 21
Розетка у чайника: включено
```

## @tests
```swift
let __t_wall = Lamp(name: "Бра", room: "Спальня", brightness: 35)
__eq("Выключенная лампа: только текст родителя", __t_wall.status(), "Бра: выключено", hint: "Пока лампа не горит, яркость не показывается: верни super.status() без добавок")
__t_wall.turnOn()
__eq("Включённая лампа с яркостью 35", __t_wall.status(), "Бра: включено, яркость 35%", hint: "К super.status() добавь запятую, пробел, слово яркость, число и знак процента")
__t_wall.brightness = 100
__eq("Яркость берётся из свойства: теперь 100", __t_wall.status(), "Бра: включено, яркость 100%", hint: "Число нужно вставить из свойства brightness, а не написать готовым")
__t_wall.brightness = 0
__eq("Включённая лампа с яркостью 0 — яркость всё равно показывается", __t_wall.status(), "Бра: включено, яркость 0%", hint: "Яркость добавляется, когда isOn равно true, — само число значения не имеет")
__t_wall.turnOff()
__eq("Лампа снова выключена — снова только текст родителя", __t_wall.status(), "Бра: выключено")

let __t_asDevice: Device = Lamp(name: "Гирлянда", room: "Балкон", brightness: 60)
__t_asDevice.turnOn()
__eq("Лампа в переменной типа Device говорит своим текстом", __t_asDevice.status(), "Гирлянда: включено, яркость 60%", hint: "Перед func status() в лампе должно стоять слово override")

let __t_floor = Thermostat(name: "Тёплый пол", room: "Ванная", targetTemperature: 27)
__eq("Выключенный термостат тоже показывает температуру", __t_floor.status(), "Тёплый пол: выключено, температура 27", hint: "У термостата температура добавляется к super.status() всегда, без условия")
__t_floor.turnOn()
__eq("Включённый термостат с температурой 27", __t_floor.status(), "Тёплый пол: включено, температура 27", hint: "Начало строки бери из super.status() — тогда включено и выключено подставятся сами")
__t_floor.targetTemperature = 19
__eq("Температура берётся из свойства: теперь 19", __t_floor.status(), "Тёплый пол: включено, температура 19", hint: "Число нужно вставить из свойства targetTemperature")

let __t_robot = Device(name: "Робот-пылесос", room: "Коридор")
__eq("У самого Device текст не изменился", __t_robot.status(), "Робот-пылесос: выключено", hint: "Класс Device менять не нужно: свои версии status() пишутся в наследниках")
let __t_socket = SmartSocket(name: "Розетка у фена", room: "Ванная")
__t_socket.turnOn()
__eq("Розетка пользуется текстом родителя", __t_socket.status(), "Розетка у фена: включено")

__eq("Название типа у Device", Device.catalogTitle, "Устройство", hint: "catalogTitle у Device менять не нужно")
__eq("Название типа у Lamp", Lamp.catalogTitle, "Лампа", hint: "В Lamp напиши override class var catalogTitle: String и верни Лампа")
__eq("Название типа у Thermostat", Thermostat.catalogTitle, "Термостат", hint: "В Thermostat напиши override class var catalogTitle: String и верни Термостат")
__eq("Название типа у SmartSocket", SmartSocket.catalogTitle, "Розетка")
let __t_kinds: [Device.Type] = [Lamp.self, Thermostat.self, SmartSocket.self, Device.self]
__eq("Каталог, собранный из типов", __t_kinds.map { $0.catalogTitle }, ["Лампа", "Термостат", "Розетка", "Устройство"], hint: "У каждого наследника должно быть своё override class var catalogTitle")
```

## @rules
- must: /\bsuper\s*\.\s*status\s*\(\s*\)/ :: Текст родителя получай вызовом `super.status()`, а не пиши его заново.
- must: /\bfinal\s+class\s+SmartSocket\b/ :: Пометь розетку словом `final`: `final class SmartSocket: Device`.

## @hint1
Начни с лампы. Внутри класса, после инициализатора, объяви метод с тем же именем и тем же типом результата, что у родителя, — `status()`, возвращает `String`. Перед `func` поставь слово, которое говорит «переопределяю».

Внутри метода развилка по `isOn`. Если лампа горит, верни родительский текст, к которому через `+` приклеена строка с яркостью. Родительский текст получают вызовом метода через слово `super` и точку. Если не горит — верни родительский текст как есть.

У термостата то же самое, только без развилки: к родительскому тексту всегда добавляется температура.

Название в каталоге — это вычисляемое свойство типа. Как оно переопределяется, видно в классе розетки: те же слова, только другой текст. Повтори это в лампе и в термостате.

И последнее: перед словом `class` у розетки допиши `final`.

## @hint2
Так наследник дополняет родительский метод:

```swift
override func report() -> String {
    return super.report() + ", протечки нет"
}
```

А так переопределяется свойство типа:

```swift
override class var catalogTitle: String {
    return "Датчик протечки"
}
```

У лампы перед дополнением нужна проверка `if isOn`, у термостата — нет.

## @hint3
Заполни пропуски в лампе и термостате. Розетке не забудь добавить `final`.

```swift
class Lamp: Device {
    var brightness: Int

    override class var catalogTitle: String {
        return ___
    }

    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

    ___ func status() -> String {
        if isOn {
            return super.status() + ", яркость \(brightness)%"
        }
        return ___
    }
}

class Thermostat: Device {
    var targetTemperature: Int

    override class var catalogTitle: String {
        return "Термостат"
    }

    init(name: String, room: String, targetTemperature: Int) {
        self.targetTemperature = targetTemperature
        super.init(name: name, room: room)
    }

    override func status() -> String {
        return ___ + ", температура \(targetTemperature)"
    }
}
```

В первом пропуске — название лампы для каталога. Во втором — слово «переопределяю». В третьем и четвёртом — вызов родительской версии метода.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Слово `override` перед `func status()` говорит Swift: у лампы будет своя версия этого метода вместо родительской. Внутри неё `super.status()` вызывает версию `Device` — ту, что собирает «Торшер: включено». Лампа дописывает к ней яркость, но только когда горит. Термостат дописывает температуру всегда.

**Почему через `super`, а не заново.** Можно было написать в лампе `"\(name): включено, яркость..."` целиком — вывод получился бы тем же. Но тогда формат «название, двоеточие, состояние» жил бы в трёх местах. Захочет дизайнер писать «вкл.» вместо «включено» — придётся искать все копии. С `super.status()` правка в `Device` сразу дойдёт до всех устройств.

**Свойство типа `class var`.** `catalogTitle` принадлежит типу: `Lamp.catalogTitle` спрашивают у класса, объект для этого не нужен. Слово `class` вместо `static` разрешает наследникам заменить значение — поэтому у каждого своё `override class var`.

**Зачем `final`.** Розетку никто не расширяет, и `final` фиксирует это в коде. Если кто-то попробует унаследоваться от `SmartSocket`, Swift не даст. Заодно компилятору проще: он точно знает, какой метод вызывать.

**Типичные ошибки:**

- забыто `override` — Swift сообщит, что метод с таким именем уже есть у родителя;
- у лампы яркость добавляется всегда, без проверки `isOn` — у выключенной лампы появится лишнее «яркость 70%»;
- `return status() + ...` без `super.` — метод вызовет сам себя, и программа упадёт;
- `static var catalogTitle` в наследнике — заменить родительское свойство можно только через `override class var`.
