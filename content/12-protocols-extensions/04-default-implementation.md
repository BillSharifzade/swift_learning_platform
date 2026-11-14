---
title: Поведение по умолчанию
concept: Расширение протокола — реализация по умолчанию и своя версия в типе
---

## @description

### Контекст
«Почтальон» учится присылать push-уведомления о новых сообщениях. Для каждого сообщения нужно знать две вещи: текст уведомления и приходит ли оно без звука.

Почти для всех сообщений правила одинаковые: текст — `отправитель: превью`, звук включён. Исключение одно — системные сообщения вроде «Сестра присоединилась к чату». Отправитель «Почтальон» в них только мешает, а звук раздражает. Тимлид просит: «Не копируй одно и то же в каждый тип. Пусть у протокола будет поведение по умолчанию, а системное сообщение переопределит его у себя».

### Новое в Swift
Расширять можно не только типы, но и **протоколы**. Метод или свойство в `extension` протокола достаётся **всем** типам, которые на него подписаны, — это **реализация по умолчанию**.

```swift
protocol Attachment {
    var fileName: String { get }
    var sizeKB: Int { get }
    var canOpenOffline: Bool { get }
    func sizeLabel() -> String
}

extension Attachment {
    var canOpenOffline: Bool {
        return true
    }

    func sizeLabel() -> String {
        return "\(sizeKB) КБ"
    }
}
```

В теле метода из расширения можно пользоваться другими требованиями протокола: `sizeKB` точно есть у любого типа, который подписан на `Attachment`.

Теперь типу достаточно выполнить требования, у которых нет реализации по умолчанию:

```swift
struct Document: Attachment {
    let fileName: String
    let sizeKB: Int
}

let contract = Document(fileName: "Договор.pdf", sizeKB: 340)
print(contract.sizeLabel())       // 340 КБ
print(contract.canOpenOffline)    // true
```

**Своя версия.** Если типу умолчание не подходит, он пишет метод или свойство с тем же именем — и тогда используется его версия:

```swift
struct VideoLink: Attachment {
    let fileName: String
    let sizeKB: Int
    var canOpenOffline: Bool {
        return false
    }

    func sizeLabel() -> String {
        return "Видео по ссылке"
    }
}
```

> ⚠️ Чтобы своя версия работала надёжно, метод должен быть **и в списке требований протокола, и в расширении**. Если он есть только в расширении, это просто общий помощник: при работе через `any Attachment` Swift вызовет версию из расширения, даже если у типа есть своя.

### Задача
В редакторе есть протокол `Message`, три обычных вида сообщений и системное сообщение `SystemMessage`.

1. Добавь в протокол `Message` два требования:
   - свойство `isSilent` типа `Bool`, только для чтения;
   - метод `notificationText()` без параметров, возвращает `String`.
2. Напиши расширение протокола `Message` с реализацией по умолчанию:
   - `isSilent` возвращает `false`;
   - `notificationText()` возвращает `отправитель: превью`.
3. В `SystemMessage` напиши свои версии: `isSilent` равно `true`, а `notificationText()` возвращает только `text`, без отправителя.
4. В `TextMessage`, `PhotoMessage` и `VoiceMessage` ничего не добавляй — им подходит поведение по умолчанию.

Проверка подпишет на протокол и свои типы сообщений: одни без этих методов, другие со своими версиями.

### Пример
Сценарий внизу редактора должен вывести:

```text
Билол: Скоро буду (со звуком)
Мама: Фото: Варенье из малины (со звуком)
Сестра: Голосовое сообщение, 20 сек. (со звуком)
Сестра присоединилась к чату (без звука)
```

## @starter
```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
    // 1. Добавь требования isSilent и notificationText()

}

// 2. Расширение протокола: поведение по умолчанию


struct TextMessage: Message {
    let sender: String
    let text: String

    func preview() -> String {
        return text
    }
}

struct PhotoMessage: Message {
    let sender: String
    let caption: String

    func preview() -> String {
        return caption.isEmpty ? "Фото" : "Фото: \(caption)"
    }
}

struct VoiceMessage: Message {
    let sender: String
    let seconds: Int

    func preview() -> String {
        return "Голосовое сообщение, \(seconds) сек."
    }
}

// Системное сообщение: о событиях в чате пишет сам "Почтальон"
struct SystemMessage: Message {
    let text: String

    var sender: String {
        return "Почтальон"
    }

    func preview() -> String {
        return text
    }

    // 3. Свои версии isSilent и notificationText()

}

// Push-уведомления для сообщений семейного чата
let familyChat: [any Message] = [
    TextMessage(sender: "Билол", text: "Скоро буду"),
    PhotoMessage(sender: "Мама", caption: "Варенье из малины"),
    VoiceMessage(sender: "Сестра", seconds: 20),
    SystemMessage(text: "Сестра присоединилась к чату")
]
for message in familyChat {
    let sound = message.isSilent ? "без звука" : "со звуком"
    print("\(message.notificationText()) (\(sound))")
}
```

## @solution
```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
    // 1. Добавь требования isSilent и notificationText()
    var isSilent: Bool { get }
    func notificationText() -> String
}

// 2. Расширение протокола: поведение по умолчанию
extension Message {
    var isSilent: Bool {
        return false
    }

    func notificationText() -> String {
        return "\(sender): \(preview())"
    }
}

struct TextMessage: Message {
    let sender: String
    let text: String

    func preview() -> String {
        return text
    }
}

struct PhotoMessage: Message {
    let sender: String
    let caption: String

    func preview() -> String {
        return caption.isEmpty ? "Фото" : "Фото: \(caption)"
    }
}

struct VoiceMessage: Message {
    let sender: String
    let seconds: Int

    func preview() -> String {
        return "Голосовое сообщение, \(seconds) сек."
    }
}

// Системное сообщение: о событиях в чате пишет сам "Почтальон"
struct SystemMessage: Message {
    let text: String

    var sender: String {
        return "Почтальон"
    }

    func preview() -> String {
        return text
    }

    // 3. Свои версии isSilent и notificationText()
    var isSilent: Bool {
        return true
    }

    func notificationText() -> String {
        return text
    }
}

// Push-уведомления для сообщений семейного чата
let familyChat: [any Message] = [
    TextMessage(sender: "Билол", text: "Скоро буду"),
    PhotoMessage(sender: "Мама", caption: "Варенье из малины"),
    VoiceMessage(sender: "Сестра", seconds: 20),
    SystemMessage(text: "Сестра присоединилась к чату")
]
for message in familyChat {
    let sound = message.isSilent ? "без звука" : "со звуком"
    print("\(message.notificationText()) (\(sound))")
}
```

## @output
```
Билол: Скоро буду (со звуком)
Мама: Фото: Варенье из малины (со звуком)
Сестра: Голосовое сообщение, 20 сек. (со звуком)
Сестра присоединилась к чату (без звука)
```

## @tests
```swift
// Новый вид сообщения без своих версий: ему должно хватить умолчаний из расширения
struct __t_StickerMessage: Message {
    let sender: String
    let stickerName: String

    func preview() -> String {
        return "Стикер: \(stickerName)"
    }
}

// Опрос со своими версиями: тихий и со своим текстом уведомления
struct __t_PollMessage: Message {
    let sender: String
    let question: String

    var isSilent: Bool {
        return true
    }

    func preview() -> String {
        return "Опрос: \(question)"
    }

    func notificationText() -> String {
        return "Новый опрос в чате: \(question)"
    }
}

let __t_sticker: any Message = __t_StickerMessage(sender: "Подруга", stickerName: "котик")
__eq("Стикер без своих версий: текст уведомления по умолчанию", __t_sticker.notificationText(), "Подруга: Стикер: котик", hint: "В расширении протокола notificationText() возвращает sender, двоеточие, пробел и preview()")
__eq("Стикер без своих версий: со звуком по умолчанию", __t_sticker.isSilent, false, hint: "В расширении протокола isSilent по умолчанию возвращает false")

let __t_poll: any Message = __t_PollMessage(sender: "Билол", question: "Куда идём в субботу?")
__eq("Опрос со своей версией текста: работает его версия", __t_poll.notificationText(), "Новый опрос в чате: Куда идём в субботу?", hint: "Метод notificationText() должен быть и в списке требований протокола, и в расширении. Если он только в расширении, своя версия типа не вызывается")
__eq("Опрос со своей версией isSilent: без звука", __t_poll.isSilent, true, hint: "Свойство isSilent должно быть в списке требований протокола: var isSilent: Bool { get }")

let __t_text: any Message = TextMessage(sender: "Билол", text: "Купил билеты")
__eq("Текстовое сообщение: уведомление по умолчанию", __t_text.notificationText(), "Билол: Купил билеты")
__eq("Текстовое сообщение: со звуком", __t_text.isSilent, false)

let __t_photo: any Message = PhotoMessage(sender: "Мама", caption: "")
__eq("Фото без подписи: уведомление по умолчанию", __t_photo.notificationText(), "Мама: Фото")

let __t_voice: any Message = VoiceMessage(sender: "Сестра", seconds: 7)
__eq("Голосовое: уведомление по умолчанию", __t_voice.notificationText(), "Сестра: Голосовое сообщение, 7 сек.")

let __t_system: any Message = SystemMessage(text: "Подруга покинула чат")
__eq("Системное сообщение через any Message: только текст", __t_system.notificationText(), "Подруга покинула чат", hint: "В SystemMessage notificationText() возвращает только text, без отправителя. И метод должен быть в списке требований протокола")
__eq("Системное сообщение через any Message: без звука", __t_system.isSilent, true, hint: "В SystemMessage isSilent возвращает true")
__eq("Системное сообщение напрямую: только текст", SystemMessage(text: "Чат переименован").notificationText(), "Чат переименован")
__eq("Отправитель системного сообщения не изменился", __t_system.sender, "Почтальон")
```

## @rules
- must: /\bextension\s+Message\b/ :: Реализацию по умолчанию нужно написать в расширении протокола: `extension Message { ... }`.
- must: /\bvar\s+isSilent\s*:\s*Bool\s*\{\s*get\s*\}/ :: Добавь в протокол требование `var isSilent: Bool { get }`.
- mustnot: /(func\s+notificationText\b[\s\S]*){4}/ :: Метод `notificationText()` должен встречаться только в трёх местах: в протоколе, в его расширении и в `SystemMessage`. Обычным сообщениям хватит версии по умолчанию.
- mustnot: /((var|let)\s+isSilent\b[\s\S]*){4}/ :: Свойство `isSilent` должно встречаться только в трёх местах: в протоколе, в его расширении и в `SystemMessage`. Обычным сообщениям хватит версии по умолчанию.

## @hint1
Работа в трёх местах кода.

Первое — протокол. Допиши в него ещё два требования: свойство, которое читается и хранит `Bool`, и метод без параметров, который возвращает строку. Записываются они так же, как `sender` и `preview()`, которые там уже есть.

Второе — расширение протокола. Оно начинается словом `extension` и именем протокола. Внутри — обычное вычисляемое свойство, которое возвращает `false`, и обычный метод с телом. Метод собирает строку из `sender` и `preview()`: в расширении протокола их можно использовать, ведь они есть у любого сообщения.

Третье — системное сообщение. Внутри `SystemMessage`, на месте комментария, напиши свойство и метод с теми же именами, но со своим поведением: тишина и только текст.

Остальные три структуры не трогай: как только расширение готово, они получают оба умолчания сами.

## @hint2
Требование в протоколе, умолчание в расширении и своя версия в типе выглядят так:

```swift
protocol Attachment {
    var sizeKB: Int { get }
    func sizeLabel() -> String
}

extension Attachment {
    func sizeLabel() -> String {
        return "\(sizeKB) КБ"
    }
}

struct VideoLink: Attachment {
    let sizeKB: Int

    func sizeLabel() -> String {
        return "Видео по ссылке"
    }
}
```

## @hint3
Протокол готов. Допиши расширение и версию для системного сообщения:

```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
    var isSilent: Bool { get }
    func notificationText() -> String
}

extension ___ {
    var isSilent: Bool {
        return false
    }

    func notificationText() -> String {
        return ___
    }
}
```

```swift
// внутри SystemMessage, после preview()
    var isSilent: Bool {
        return ___
    }

    func notificationText() -> String {
        return text
    }
```

В первом пропуске — имя протокола. Во втором — строка из `sender` и `preview()` через интерполяцию. В третьем — значение, которое делает системные уведомления тихими.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Протокол перечисляет четыре требования. Два из них — `isSilent` и `notificationText()` — сразу выполнены в `extension Message`. Поэтому `TextMessage`, `PhotoMessage` и `VoiceMessage` подписаны на протокол, хотя этих членов у них нет: они получают версии из расширения. Метод по умолчанию спокойно вызывает `sender` и `preview()` — эти требования обязан выполнить любой тип, иначе он не был бы `Message`.

`SystemMessage` объявляет свои `isSilent` и `notificationText()`. Когда тип пишет член с тем же именем, его версия важнее версии из расширения. Поэтому push для системного сообщения тихий и без слова «Почтальон».

**Почему требования обязательно и в протоколе.** Цикл внизу работает с `any Message` и не знает, что лежит в каждой коробке. Если `notificationText()` есть в списке требований, Swift при каждом вызове заглядывает в коробку и ищет версию настоящего типа. Если метод только в расширении, Swift вызывает версию из расширения не глядя — и системное сообщение получило бы «Почтальон: ...». Проверка ловит именно это с помощью своего типа-опроса.

**Типичные ошибки:**

- метод написан только в расширении, а в протокол не добавлен — своя версия `SystemMessage` молча игнорируется при работе через `any Message`;
- одинаковый `notificationText()` скопирован в каждую структуру — работает, но расширение протокола придумано как раз для того, чтобы так не делать;
- в расширении протокола попытка завести хранимое свойство `var isSilent = false` — в расширениях бывают только вычисляемые свойства.
