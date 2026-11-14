---
title: Настройка из конфигурации
concept: Виды инициализаторов — designated, convenience, failable, required
---

## @description

### Контекст
Лампа попадает в «Гнездо» тремя путями, и для каждого нужен свой способ её создать.

- **Вручную.** В форме «Добавить лампу» вводят только название и комнату. Новая лампа светит на полную яркость — 100.
- **По QR-коду с коробки.** Приложение получает конфигурацию — словарь `[String: Any]`: название и комната там текстом, яркость числом. Коды бывают испорчены, поэтому из плохой конфигурации лампа не должна создаваться.
- **Из резервной копии.** Сервис восстановления написан для всех устройств сразу и создаёт любое из них по названию и комнате. Поэтому инициализатор `Device` помечен как `required`.

Тимлид: «Основной инициализатор лампы уже есть. Допиши два вспомогательных — и код перестанет ругаться».

### Новое в Swift
**Основной (designated) инициализатор** — тот, что ты писала до сих пор. Он сам заполняет свойства класса и вызывает `super.init` для родительской части. У класса обязательно есть хотя бы один такой.

**Вспомогательный (convenience) инициализатор** — короткий путь для частого случая. Он ничего не заполняет сам, а вызывает другой инициализатор того же класса через `self.init`:

```swift
class Speaker {
    let name: String
    var volume: Int

    init(name: String, volume: Int) {
        self.name = name
        self.volume = volume
    }

    convenience init(name: String) {
        self.init(name: name, volume: 30)
    }
}

let kitchen = Speaker(name: "Колонка на кухне")   // громкость 30
```

Правило простое: основной вызывает `super.init`, вспомогательный — `self.init`.

**Инициализатор, который может отказать.** `init?` ты знаешь по структурам. В классах он работает так же и тоже бывает вспомогательным:

```swift
convenience init?(settings: [String: Any]) {
    guard let name = settings["title"] as? String else {
        return nil
    }
    let volume = settings["volume"] as? Int ?? 30
    self.init(name: name, volume: volume)
}
```

Из словаря `[String: Any]` значение приходит как `Any?` — «что угодно или ничего». `as? String` превращает его в `String?`: строку, если там строка, иначе `nil`. А `?? 30` подставляет запасное значение.

**Обязательный (required) инициализатор.** Слово `required` в родителе означает: этот инициализатор обязан быть у каждого наследника. Если у наследника есть свой основной `init`, Swift потребует написать и обязательный — тоже со словом `required`:

```swift
class Sensor {
    let name: String

    required init(name: String) {
        self.name = name
    }
}

class SmokeSensor: Sensor {
    var sensitivity: Int

    init(name: String, sensitivity: Int) {
        self.sensitivity = sensitivity
        super.init(name: name)
    }

    required init(name: String) {
        self.sensitivity = 5
        super.init(name: name)
    }
}
```

Слова можно сочетать: `required convenience init(...)` — обязательный инициализатор, который просто вызывает основной через `self.init`.

### Задача
Классы `Device` и основной инициализатор `Lamp` менять не нужно. Сейчас код не собирается: у лампы нет обязательного инициализатора, которого требует `Device`. Добавь в `Lamp`:

1. `required convenience init(name: String, room: String)` — вызывает основной инициализатор с яркостью `100`.
2. `convenience init?(config: [String: Any])` — лампа из конфигурации:
   - `"name"` и `"room"` должны быть строками. Если любого из ключей нет или там не строка — `nil`;
   - `"brightness"` — необязательный ключ. Если его нет или там не целое число, яркость `100`;
   - если яркость — число меньше `0` или больше `100`, — `nil`;
   - иначе вызови основной инициализатор с этими значениями.

### Пример
```swift
Lamp(name: "Бра", room: "Спальня").brightness                          // 100
Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": 0])     // лампа с яркостью 0
Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": 101])   // nil
Lamp(config: ["name": "Бра"])                                         // nil: нет комнаты
```

Сценарий из редактора должен вывести:

```text
Торшер, Гостиная: яркость 100
Добавлена: Люстра, Кухня: яркость 60
Добавлена: Подсветка зеркала, Ванная: яркость 100
Не удалось добавить устройство
Не удалось добавить устройство
```

## @starter
```swift
// Общий родитель устройств. Этот класс менять не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    // Сервис восстановления из резервной копии создаёт устройство любого типа
    // по названию и комнате. Поэтому этот инициализатор обязателен для наследников
    required init(name: String, room: String) {
        self.name = name
        self.room = room
    }
}

class Lamp: Device {
    var brightness: Int

    // Основной инициализатор лампы. Его менять не нужно
    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

    // 1. Обязательный инициализатор: только название и комната, яркость 100


    // 2. Лампа из конфигурации QR-кода. Плохая конфигурация - nil

}

// Сценарий: лампа из формы и лампы по QR-кодам. Этот код менять не нужно
let manualLamp = Lamp(name: "Торшер", room: "Гостиная")
print("\(manualLamp.name), \(manualLamp.room): яркость \(manualLamp.brightness)")

let scanned: [String: Any] = ["name": "Люстра", "room": "Кухня", "brightness": 60]
let withoutBrightness: [String: Any] = ["name": "Подсветка зеркала", "room": "Ванная"]
let withoutRoom: [String: Any] = ["name": "Ночник", "brightness": 40]
let tooBright: [String: Any] = ["name": "Прожектор", "room": "Балкон", "brightness": 150]

for config in [scanned, withoutBrightness, withoutRoom, tooBright] {
    if let lamp = Lamp(config: config) {
        print("Добавлена: \(lamp.name), \(lamp.room): яркость \(lamp.brightness)")
    } else {
        print("Не удалось добавить устройство")
    }
}
```

## @solution
```swift
// Общий родитель устройств. Этот класс менять не нужно
class Device {
    let name: String
    let room: String
    var isOn = false

    // Сервис восстановления из резервной копии создаёт устройство любого типа
    // по названию и комнате. Поэтому этот инициализатор обязателен для наследников
    required init(name: String, room: String) {
        self.name = name
        self.room = room
    }
}

class Lamp: Device {
    var brightness: Int

    // Основной инициализатор лампы. Его менять не нужно
    init(name: String, room: String, brightness: Int) {
        self.brightness = brightness
        super.init(name: name, room: room)
    }

    // 1. Обязательный инициализатор: только название и комната, яркость 100
    required convenience init(name: String, room: String) {
        self.init(name: name, room: room, brightness: 100)
    }

    // 2. Лампа из конфигурации QR-кода. Плохая конфигурация - nil
    convenience init?(config: [String: Any]) {
        guard let name = config["name"] as? String,
              let room = config["room"] as? String else {
            return nil
        }
        let brightness = config["brightness"] as? Int ?? 100
        guard brightness >= 0 && brightness <= 100 else {
            return nil
        }
        self.init(name: name, room: room, brightness: brightness)
    }
}

// Сценарий: лампа из формы и лампы по QR-кодам. Этот код менять не нужно
let manualLamp = Lamp(name: "Торшер", room: "Гостиная")
print("\(manualLamp.name), \(manualLamp.room): яркость \(manualLamp.brightness)")

let scanned: [String: Any] = ["name": "Люстра", "room": "Кухня", "brightness": 60]
let withoutBrightness: [String: Any] = ["name": "Подсветка зеркала", "room": "Ванная"]
let withoutRoom: [String: Any] = ["name": "Ночник", "brightness": 40]
let tooBright: [String: Any] = ["name": "Прожектор", "room": "Балкон", "brightness": 150]

for config in [scanned, withoutBrightness, withoutRoom, tooBright] {
    if let lamp = Lamp(config: config) {
        print("Добавлена: \(lamp.name), \(lamp.room): яркость \(lamp.brightness)")
    } else {
        print("Не удалось добавить устройство")
    }
}
```

## @output
```
Торшер, Гостиная: яркость 100
Добавлена: Люстра, Кухня: яркость 60
Добавлена: Подсветка зеркала, Ванная: яркость 100
Не удалось добавить устройство
Не удалось добавить устройство
```

## @tests
```swift
// Так работает сервис восстановления: создаёт устройство по его типу
func __t_restore(_ type: Device.Type, name: String, room: String) -> Device {
    return type.init(name: name, room: room)
}
func __t_brightness(_ lamp: Lamp?) -> Int {
    return lamp?.brightness ?? -1
}

let __t_manual = Lamp(name: "Бра", room: "Спальня")
__eq("Лампа из формы: название", __t_manual.name, "Бра", hint: "Передай параметр name в основной инициализатор через self.init")
__eq("Лампа из формы: комната", __t_manual.room, "Спальня")
__eq("Лампа из формы: яркость 100", __t_manual.brightness, 100, hint: "В self.init передай яркость 100")
__eq("Лампа из формы выключена", __t_manual.isOn, false)

let __t_restored = __t_restore(Lamp.self, name: "Гирлянда", room: "Балкон")
__ok("Восстановление из копии создаёт именно лампу", __t_restored is Lamp, hint: "У лампы должен быть свой required init(name:room:)")
__eq("Восстановленная лампа получает яркость 100", __t_brightness(__t_restored as? Lamp), 100, hint: "Обязательный инициализатор лампы вызывает основной с яркостью 100")
__eq("Восстановленная лампа: название", __t_restored.name, "Гирлянда")

let __t_full = Lamp(config: ["name": "Люстра", "room": "Гостиная", "brightness": 45])
__ok("Полная конфигурация: лампа создана", __t_full != nil, hint: "Если название и комната — строки, а яркость от 0 до 100, инициализатор не должен возвращать nil")
__eq("Полная конфигурация: название", __t_full?.name ?? "(nil)", "Люстра")
__eq("Полная конфигурация: комната", __t_full?.room ?? "(nil)", "Гостиная")
__eq("Полная конфигурация: яркость 45", __t_brightness(__t_full), 45, hint: "Яркость возьми из словаря: config[\"brightness\"] as? Int")

__eq("Без яркости — 100", __t_brightness(Lamp(config: ["name": "Бра", "room": "Спальня"])), 100, hint: "Если ключа brightness нет, яркость 100: config[\"brightness\"] as? Int ?? 100")
__eq("Яркость текстом, а не числом — 100", __t_brightness(Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": "70"])), 100, hint: "Текст 70 — не Int, поэтому as? Int даёт nil, и срабатывает запасное значение 100")
__eq("Яркость ровно 0 — допустима", __t_brightness(Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": 0])), 0, hint: "Границы 0 и 100 входят в допустимый диапазон")
__eq("Яркость ровно 100 — допустима", __t_brightness(Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": 100])), 100, hint: "Границы 0 и 100 входят в допустимый диапазон")
__ok("Яркость 101 — nil", Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": 101]) == nil, hint: "Яркость больше 100 — повод вернуть nil")
__ok("Яркость -1 — nil", Lamp(config: ["name": "Бра", "room": "Спальня", "brightness": -1]) == nil, hint: "Яркость меньше 0 — повод вернуть nil")

__ok("Без названия — nil", Lamp(config: ["room": "Спальня", "brightness": 50]) == nil, hint: "Без строки по ключу name лампу создать нельзя")
__ok("Без комнаты — nil", Lamp(config: ["name": "Бра", "brightness": 50]) == nil, hint: "Без строки по ключу room лампу создать нельзя")
__ok("Название числом, а не текстом — nil", Lamp(config: ["name": 42, "room": "Спальня"]) == nil, hint: "Название должно быть строкой: config[\"name\"] as? String")
__ok("Комната числом, а не текстом — nil", Lamp(config: ["name": "Бра", "room": 3]) == nil, hint: "Комната должна быть строкой: config[\"room\"] as? String")
__ok("Пустая конфигурация — nil", Lamp(config: [:]) == nil)

let __t_direct = Lamp(name: "Ночник", room: "Детская", brightness: 15)
__eq("Основной инициализатор по-прежнему работает", __t_direct.brightness, 15)
```

## @rules
- must: /\bconvenience\s+init\s*\?\s*\(\s*config\b/ :: Лампа из конфигурации — вспомогательный инициализатор, который может отказать: `convenience init?(config: [String: Any])`.
- must: /\bself\s*\.\s*init\s*\(/ :: Вспомогательные инициализаторы не заполняют свойства сами, а вызывают основной: `self.init(name: ..., room: ..., brightness: ...)`.

## @hint1
Оба новых инициализатора пишутся внутри `Lamp`, под основным.

Первый — обязательный и вспомогательный сразу, поэтому перед `init` два слова: `required` и `convenience`. Параметры — название и комната. Внутри одна строка: вызов основного инициализатора через `self.init`, куда передаются название, комната и яркость 100.

Второй — вспомогательный, который может отказать: `convenience init?` с параметром `config`. Внутри сначала `guard let`: достань из словаря название и комнату, превращая каждое значение в строку через `as?`. Оба условия пишутся через запятую. Если не вышло — `return nil`.

Потом яркость: значение по ключу, превращённое в целое число через `as?`, а на случай `nil` — запасные 100 через `??`. Дальше ещё один `guard`: яркость не меньше нуля и не больше ста, иначе `nil`.

В самом конце — вызов основного инициализатора через `self.init` с тремя значениями.

## @hint2
Вспомогательный инициализатор, который читает словарь и может отказать:

```swift
convenience init?(settings: [String: Any]) {
    guard let name = settings["title"] as? String else {
        return nil
    }
    let volume = settings["volume"] as? Int ?? 30
    self.init(name: name, volume: volume)
}
```

А обязательный вспомогательный выглядит так:

```swift
required convenience init(name: String) {
    self.init(name: name, volume: 30)
}
```

## @hint3
Заполни пропуски:

```swift
    required convenience init(name: String, room: String) {
        self.init(name: name, room: room, brightness: ___)
    }

    convenience init?(config: [String: Any]) {
        guard let name = config["name"] as? String,
              let room = config["room"] ___ String else {
            return nil
        }
        let brightness = config["brightness"] as? Int ?? ___
        guard brightness >= 0 && brightness <= 100 else {
            return ___
        }
        self.init(name: name, room: room, brightness: brightness)
    }
```

По порядку: яркость новой лампы; оператор безопасного приведения; запасная яркость; что возвращает инициализатор, когда отказывается создавать лампу.

## @hint4
Вот готовое решение:

{{solution}}

**Почему код не собирался.** В `Device` инициализатор `init(name:room:)` помечен как `required`. Пока у лампы не было своих основных инициализаторов, она получала его от родителя. Но у лампы есть свойство `brightness`, и ей пришлось написать свой `init(name:room:brightness:)`. После этого родительские инициализаторы перестали наследоваться, и Swift потребовал явно написать обязательный.

**Обязательный инициализатор.** `required convenience init(name:room:)` выполняет обещание родителя: лампу можно создать по названию и комнате. Сам он ничего не заполняет — он вспомогательный и передаёт работу основному, подставляя яркость 100. Проверка вызвала его так же, как это делает сервис восстановления, — не зная заранее, что создаёт лампу.

**Лампа из конфигурации.** `config["name"] as? String` делает два дела сразу: достаёт значение по ключу и проверяет, что это строка. Если ключа нет или там число, получится `nil`, и `guard` вернёт `nil` из инициализатора. Яркость устроена мягче: `as? Int ?? 100` даёт 100, когда ключа нет. А второй `guard` отсекает числа вне диапазона.

**Почему везде `self.init`.** Свойства лампы заполняет только основной инициализатор, и проверки «сначала свои свойства, потом `super.init`» живут в одном месте. Вспомогательные лишь готовят для него значения.

**Типичные ошибки:**

- `override` вместо `required` у обязательного инициализатора — для него нужно именно `required`;
- `super.init` во вспомогательном инициализаторе — Swift напомнит, что он должен вызывать `self.init`;
- `config["brightness"] as? Int ?? 100` заменено на `config["brightness"] as! Int` — конфигурация без яркости уронит приложение;
- проверка `brightness > 0` вместо `>= 0` — лампа с яркостью 0 из конфигурации не создастся.
