---
title: Лента чата
concept: Протокол как тип — any, массив разных типов, параметр-протокол
---

## @description

### Контекст
Протокол `Message` готов, и теперь экран чата может работать с любыми сообщениями одинаково. Но в прототипе лента пока хранится в трёх отдельных массивах: тексты, фото, голосовые. Из-за этого сообщения на экране идут не по порядку, а группами.

Тимлид просит: «Сделай одну ленту, в которой сообщения лежат в том порядке, в каком их отправили, — неважно какого вида. И три функции для экрана: строки ленты, счётчик сообщений от человека и превью для списка чатов».

### Новое в Swift
**Протокол можно использовать как тип.** Константа, параметр функции или элемент массива могут иметь тип «любое значение, подписанное на протокол». Записывается это словом `any` перед именем протокола. Возьмём значки профиля из прошлой задачи:

```swift
let badge: any ProfileBadge = SupportBadge(title: "Поддержка", replyMinutes: 5)
```

`any ProfileBadge` читается как «любой значок». Представь коробку с надписью «значок». В неё можно положить `VerifiedBadge`, `SupportBadge` или значок, который придумают через год, — лишь бы он был подписан на протокол.

**Массив из значений разных типов.** Обычный массив хранит значения одного типа. Но если тип элементов — протокол, в одном массиве уживаются разные структуры:

```swift
let badges: [any ProfileBadge] = [
    VerifiedBadge(title: "Автор канала"),
    SupportBadge(title: "Поддержка", replyMinutes: 5)
]
```

Здесь тип нужно указать явно. Без `[any ProfileBadge]` Swift увидит в скобках две разные структуры и не поймёт, какой массив ты хочешь, — сообщит об ошибке.

**Параметр-протокол.** Функция, которая принимает `any ProfileBadge`, работает с любым значком:

```swift
func badgeLines(_ badges: [any ProfileBadge]) -> [String] {
    return badges.map { $0.badgeText() }
}
```

**Через коробку видно только то, что обещал протокол.** У элемента `badges` можно взять `title` и вызвать `badgeText()`. А вот `replyMinutes` недоступно, даже если внутри лежит `SupportBadge`: протокол такого свойства не обещал. Если очень нужно узнать настоящий тип, помогают знакомые по классам `is` и `as?`. Но чаще хватает того, что есть в протоколе, — ради этого его и придумывают.

> 💡 В старом коде можно встретить запись без `any`: `[ProfileBadge]`. Это то же самое. Современный Swift советует писать `any`, чтобы было сразу видно: здесь коробка с «каким-то» типом внутри.

### Задача
В редакторе есть протокол `Message`, три вида сообщений и четыре готовых сообщения из семейного чата.

1. Объяви константу `familyChat` типа `[any Message]`: сообщения `question`, `dinnerPhoto`, `voiceReply`, `onMyWay` — именно в таком порядке.
2. Допиши функцию `chatLines(_:)`. Она получает ленту `[any Message]` и возвращает `[String]`: для каждого сообщения строку `отправитель: превью`, в том же порядке, что в ленте.
3. Напиши функцию `messageCount(from:in:)`. Параметры: `sender` типа `String` с меткой `from` и лента `[any Message]` с меткой `in`. Возвращает `Int` — сколько сообщений в ленте от этого отправителя.
4. Напиши функцию `lastPreview(in:)`. Параметр — лента `[any Message]` с меткой `in`. Возвращает `String`: превью последнего сообщения, а если лента пустая — `Сообщений пока нет`.

Проверка передаст в функции и ленты со своим видом сообщения, которого нет в твоём коде.

### Пример
Сценарий внизу редактора должен вывести:

```text
Билол: Во сколько ужин?
Мама: Фото: Сырники
Сестра: Голосовое сообщение, 15 сек.
Билол: Уже еду
Билол, сообщений: 2
В списке чатов: Уже еду
```

Для пустой ленты `lastPreview(in: [])` возвращает `Сообщений пока нет`, а `messageCount(from: "Мама", in: [])` — `0`.

## @starter
```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
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

// Сообщения семейного чата в порядке отправки
let question = TextMessage(sender: "Билол", text: "Во сколько ужин?")
let dinnerPhoto = PhotoMessage(sender: "Мама", caption: "Сырники")
let voiceReply = VoiceMessage(sender: "Сестра", seconds: 15)
let onMyWay = TextMessage(sender: "Билол", text: "Уже еду")

// 1. Сложи все четыре сообщения в одну ленту familyChat


// 2. Строки ленты: "отправитель: превью"
func chatLines(_ feed: [any Message]) -> [String] {
    // Заглушка: замени её
    return []
}

// 3. Сколько сообщений в ленте от отправителя sender


// 4. Превью последнего сообщения или "Сообщений пока нет"


// Экран чата
for line in chatLines(familyChat) {
    print(line)
}
print("Билол, сообщений: \(messageCount(from: "Билол", in: familyChat))")
print("В списке чатов: \(lastPreview(in: familyChat))")
```

## @solution
```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
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

// Сообщения семейного чата в порядке отправки
let question = TextMessage(sender: "Билол", text: "Во сколько ужин?")
let dinnerPhoto = PhotoMessage(sender: "Мама", caption: "Сырники")
let voiceReply = VoiceMessage(sender: "Сестра", seconds: 15)
let onMyWay = TextMessage(sender: "Билол", text: "Уже еду")

// 1. Сложи все четыре сообщения в одну ленту familyChat
let familyChat: [any Message] = [question, dinnerPhoto, voiceReply, onMyWay]

// 2. Строки ленты: "отправитель: превью"
func chatLines(_ feed: [any Message]) -> [String] {
    return feed.map { "\($0.sender): \($0.preview())" }
}

// 3. Сколько сообщений в ленте от отправителя sender
func messageCount(from sender: String, in feed: [any Message]) -> Int {
    return feed.filter { $0.sender == sender }.count
}

// 4. Превью последнего сообщения или "Сообщений пока нет"
func lastPreview(in feed: [any Message]) -> String {
    return feed.last?.preview() ?? "Сообщений пока нет"
}

// Экран чата
for line in chatLines(familyChat) {
    print(line)
}
print("Билол, сообщений: \(messageCount(from: "Билол", in: familyChat))")
print("В списке чатов: \(lastPreview(in: familyChat))")
```

## @output
```
Билол: Во сколько ужин?
Мама: Фото: Сырники
Сестра: Голосовое сообщение, 15 сек.
Билол: Уже еду
Билол, сообщений: 2
В списке чатов: Уже еду
```

## @tests
```swift
// Новый вид сообщения, которого нет в коде ученицы
struct __t_StickerMessage: Message {
    let sender: String
    let stickerName: String

    func preview() -> String {
        return "Стикер: \(stickerName)"
    }
}

__eq("В ленте familyChat четыре сообщения", familyChat.count, 4, hint: "Положи в массив все четыре сообщения: question, dinnerPhoto, voiceReply, onMyWay")
__eq("Сообщения в ленте идут в порядке отправки", familyChat.map { $0.preview() }, ["Во сколько ужин?", "Фото: Сырники", "Голосовое сообщение, 15 сек.", "Уже еду"], hint: "Порядок такой: question, dinnerPhoto, voiceReply, onMyWay")

let __t_bookClub: [any Message] = [
    __t_StickerMessage(sender: "Подруга", stickerName: "книга"),
    TextMessage(sender: "Билол", text: "Я дочитал"),
    VoiceMessage(sender: "Подруга", seconds: 8),
    PhotoMessage(sender: "Подруга", caption: ""),
    __t_StickerMessage(sender: "Билол", stickerName: "сова")
]
let __t_empty: [any Message] = []

__eq("Строки ленты книжного клуба, со стикерами", chatLines(__t_bookClub), ["Подруга: Стикер: книга", "Билол: Я дочитал", "Подруга: Голосовое сообщение, 8 сек.", "Подруга: Фото", "Билол: Стикер: сова"], hint: "Для каждого сообщения: sender, двоеточие, пробел и preview(). Функция должна работать с любым видом сообщения")
__eq("Строки ленты: одно сообщение", chatLines([onMyWay]), ["Билол: Уже еду"])
__eq("Строки пустой ленты: пустой массив", chatLines(__t_empty), [], hint: "Для пустой ленты строк нет")

__eq("Сообщений от подруги в книжном клубе: 3", messageCount(from: "Подруга", in: __t_bookClub), 3, hint: "Посчитай сообщения, у которых sender совпадает с переданным отправителем")
__eq("Сообщений от Билола в книжном клубе: 2", messageCount(from: "Билол", in: __t_bookClub), 2)
__eq("Сообщений от мамы в книжном клубе нет", messageCount(from: "Мама", in: __t_bookClub), 0, hint: "Если отправитель не писал в ленту, верни 0")
__eq("В пустой ленте сообщений нет", messageCount(from: "Билол", in: __t_empty), 0)

__eq("Превью последнего сообщения: стикер", lastPreview(in: __t_bookClub), "Стикер: сова", hint: "Нужно превью именно последнего сообщения ленты")
__eq("Превью последнего сообщения: голосовое", lastPreview(in: [question, voiceReply]), "Голосовое сообщение, 15 сек.")
__eq("Пустая лента: Сообщений пока нет", lastPreview(in: __t_empty), "Сообщений пока нет", hint: "Свойство last у пустого массива даёт nil. Подставь текст Сообщений пока нет")
```

## @rules
- must: /\[\s*any\s+Message\s*\]/ :: Тип ленты записывается как `[any Message]` — массив значений любых типов, подписанных на `Message`.
- must: /\bfamilyChat\s*:\s*\[\s*any\s+Message\s*\]/ :: Укажи тип ленты явно: `let familyChat: [any Message] = [...]`.

## @hint1
Начни с ленты. Это обычный массив из четырёх готовых констант, но у них разные типы, поэтому тип массива нужно указать явно — после имени, через двоеточие. Тип: квадратные скобки, а в них слово `any` и имя протокола.

`chatLines` превращает каждое сообщение в строку — значит, пригодится `map`. В замыкании у каждого элемента есть `sender` и `preview()`: их и вставь в строку через интерполяцию, с двоеточием и пробелом между ними.

`messageCount(from:in:)` — подсчёт с условием. Отбери сообщения, у которых отправитель совпадает с параметром, и возьми количество отобранных. Внутренние имена параметров придумай сама, но метки должны быть ровно `from` и `in`.

В `lastPreview(in:)` возьми последний элемент ленты. Его может не быть — у пустого массива `last` возвращает `nil`. Вызови у него `preview()` через знак вопроса и подставь запасной текст оператором `??`.

## @hint2
Функция с параметром-протоколом и массив значений разных типов:

```swift
let badges: [any ProfileBadge] = [
    VerifiedBadge(title: "Автор канала"),
    SupportBadge(title: "Поддержка", replyMinutes: 5)
]

func badgeLines(_ badges: [any ProfileBadge]) -> [String] {
    return badges.map { $0.badgeText() }
}
```

А подсчёт с условием ты уже делала в «Ярмарке»: `filter { ... }.count`.

## @hint3
Лента и две функции почти готовы. Заполни пропуски и допиши последнюю функцию:

```swift
let familyChat: ___ = [question, dinnerPhoto, voiceReply, onMyWay]

func chatLines(_ feed: [any Message]) -> [String] {
    return feed.map { "\($0.sender): \(___)" }
}

func messageCount(from sender: String, in feed: [any Message]) -> Int {
    return feed.filter { $0.sender == sender }.count
}

func lastPreview(in feed: [any Message]) -> String {
    return ___ ?? "Сообщений пока нет"
}
```

В первом пропуске — тип ленты. Во втором — вызов превью у элемента. В третьем — цепочка: последний элемент ленты, знак вопроса и вызов `preview()`.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `[any Message]` — массив коробок, и в каждой может лежать сообщение любого вида. Поэтому `question` (текст), `dinnerPhoto` (фото) и `voiceReply` (голосовое) спокойно живут в одной ленте и идут в порядке отправки. Функции принимают такую ленту и обращаются к элементам только через то, что обещал протокол: `sender` и `preview()`. Для каждого элемента Swift сам вызовет `preview()` того типа, который лежит в коробке: у фото получится `Фото: Сырники`, у голосового — строка с секундами.

**Почему тип ленты нужно писать явно.** Увидев `[question, dinnerPhoto]`, Swift не станет сам догадываться, что общего у текста и фото: общих протоколов у типов может быть несколько. Запись `[any Message]` отвечает на этот вопрос.

**Почему функции не знают о видах сообщений.** В них нет ни `TextMessage`, ни `PhotoMessage`. Поэтому проверка смогла передать в них стикер — тип, которого в твоём коде нет, — и всё сработало. Завтра в «Почтальоне» появятся опросы или геометки, а эти функции менять не придётся.

**Типичные ошибки:**

- лента объявлена без типа — Swift сообщает, что не может определить тип массива из разных значений;
- в замыкании обращение к `$0.text` или `$0.caption` — через `any Message` видно только `sender` и `preview()`;
- `feed.last.preview()` без знака вопроса — `last` возвращает опционал, ведь лента бывает пустой;
- метки перепутаны местами или названы по-другому: проверка вызывает именно `messageCount(from:in:)` и `lastPreview(in:)`.
