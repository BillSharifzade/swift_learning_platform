---
title: Несколько ролей
concept: Наследование протоколов, композиция A & B, mutating-требования, подпись в расширении
---

## @description

### Контекст
Дизайнер принёс макет меню, которое открывается долгим нажатием на сообщение. Пункт «Ответить» есть всегда. «Изменить» — только у того, что можно редактировать: у текста и у подписи к фото. «Скачать» — только у того, что хранится файлом: у фото и голосовых. А ещё в информации о чате появится вкладка «Файлы» со списком всего, что можно скачать.

Тимлид предлагает не раздувать протокол `Message`, а завести маленькие протоколы-роли: «Каждый вид сообщения получит ровно те роли, которые ему подходят. А меню и вкладка "Файлы" будут спрашивать про роли, а не про конкретные типы».

### Новое в Swift
**Наследование протоколов.** Протокол может расширять другой протокол. Тогда тип, подписанный на него, обязан выполнить требования обоих:

```swift
protocol Participant {
    var nickname: String { get }
}

protocol Admin: Participant {
    var canPin: Bool { get }
}
```

Любой `Admin` — заодно и `Participant`. Через `any Admin` видно и `canPin`, и `nickname`. Похоже на наследование классов, только наследуются обязанности, а не код.

**`mutating` в требованиях.** Если метод протокола будет менять свойства структуры, в требовании пишут `mutating` — так же, как в самой структуре. Без этого слова структура не сможет выполнить требование своим `mutating`-методом. Классам `mutating` не нужен, они выполняют такое требование обычным методом.

```swift
protocol Subscriber {
    var notificationsOn: Bool { get }
    mutating func toggleNotifications()
}
```

**Подпись в расширении.** Подписать тип на протокол можно не только в объявлении, но и в расширении. Удобно: каждая роль со своим кодом лежит отдельно. Если всё нужное у типа уже есть, расширение остаётся пустым:

```swift
struct ChannelReader {
    let nickname: String
    var notificationsOn: Bool
}

extension ChannelReader: Participant {}   // nickname уже есть, писать нечего

extension ChannelReader: Subscriber {
    mutating func toggleNotifications() {
        notificationsOn = !notificationsOn
    }
}
```

**Композиция `A & B`.** Иногда функции нужно значение, которое играет сразу две роли. Их соединяют знаком `&`:

```swift
func settingsLine(for user: any Participant & Subscriber) -> String {
    let state = user.notificationsOn ? "вкл." : "выкл."
    return "\(user.nickname): уведомления \(state)"
}
```

Передать сюда можно только то, что подписано на оба протокола.

**Вопрос о роли.** Знакомые по классам `is` и `as?` работают и с протоколами: `user is any Admin` — `true`, если значение подписано на `Admin`.

> 💡 Протокол может требовать и инициализатор: `init(draftText: String)` в списке требований значит «тип обязан уметь создаваться так». По-настоящему это пригодится вместе с дженериками, в модуле 14.

### Задача
В редакторе есть протокол `Message` и три вида сообщений. У `PhotoMessage` и `VoiceMessage` уже есть свойство `fileSizeKB`.

1. Объяви протокол `Downloadable` с требованием свойства `fileSizeKB` типа `Int`, только для чтения.
2. Объяви протокол `Editable`, который наследует `Message`, с требованием `mutating`-метода `edit(to:)`: параметр `newText` типа `String` с меткой `to`, без результата.
3. Раздай роли через расширения, не меняя объявления структур:
   - `TextMessage` — `Editable`, `edit(to:)` меняет `text`;
   - `PhotoMessage` — `Editable` и `Downloadable`, `edit(to:)` меняет `caption`;
   - `VoiceMessage` — только `Downloadable`.
4. Напиши функцию `fileRow(for:)`. Параметр с меткой `for` типа `any Message & Downloadable`. Возвращает строку: размер, ` КБ - `, превью и в скобках отправитель. Например: `2048 КБ - Фото: Рецепт пирога (Мама)`.
5. Допиши функцию `menuActions(for:)`: после `Ответить` она добавляет `Изменить`, если сообщение `Editable`, и затем `Скачать`, если оно `Downloadable`.

### Пример
Сценарий внизу редактора должен вывести:

```text
Встречаемся в 18:30
["Ответить", "Изменить"]
["Ответить", "Изменить", "Скачать"]
["Ответить", "Скачать"]
2048 КБ - Фото: Рецепт пирога (Мама)
310 КБ - Голосовое сообщение, 35 сек. (Сестра)
```

## @starter
```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
}

// 1. Роль "можно скачать"


// 2. Роль "можно изменить": наследует Message


struct TextMessage: Message {
    let sender: String
    var text: String

    func preview() -> String {
        return text
    }
}

struct PhotoMessage: Message {
    let sender: String
    var caption: String
    let fileSizeKB: Int

    func preview() -> String {
        return caption.isEmpty ? "Фото" : "Фото: \(caption)"
    }
}

struct VoiceMessage: Message {
    let sender: String
    let seconds: Int
    let fileSizeKB: Int

    func preview() -> String {
        return "Голосовое сообщение, \(seconds) сек."
    }
}

// 3. Роли через расширения: текст и фото можно изменить, фото и голосовое - скачать


// 4. Строка во вкладке "Файлы"


// 5. Пункты меню по долгому нажатию
func menuActions(for message: any Message) -> [String] {
    var actions = ["Ответить"]
    // Добавь "Изменить" и "Скачать" для сообщений с этими ролями

    return actions
}

var note = TextMessage(sender: "Билол", text: "Встречаемся в 18:00")
let photo = PhotoMessage(sender: "Мама", caption: "Рецепт пирога", fileSizeKB: 2048)
let voice = VoiceMessage(sender: "Сестра", seconds: 35, fileSizeKB: 310)

note.edit(to: "Встречаемся в 18:30")
print(note.preview())

let chat: [any Message] = [note, photo, voice]
for message in chat {
    print(menuActions(for: message))
}

let files: [any Message & Downloadable] = [photo, voice]
for file in files {
    print(fileRow(for: file))
}
```

## @solution
```swift
protocol Message {
    var sender: String { get }
    func preview() -> String
}

// 1. Роль "можно скачать"
protocol Downloadable {
    var fileSizeKB: Int { get }
}

// 2. Роль "можно изменить": наследует Message
protocol Editable: Message {
    mutating func edit(to newText: String)
}

struct TextMessage: Message {
    let sender: String
    var text: String

    func preview() -> String {
        return text
    }
}

struct PhotoMessage: Message {
    let sender: String
    var caption: String
    let fileSizeKB: Int

    func preview() -> String {
        return caption.isEmpty ? "Фото" : "Фото: \(caption)"
    }
}

struct VoiceMessage: Message {
    let sender: String
    let seconds: Int
    let fileSizeKB: Int

    func preview() -> String {
        return "Голосовое сообщение, \(seconds) сек."
    }
}

// 3. Роли через расширения: текст и фото можно изменить, фото и голосовое - скачать
extension TextMessage: Editable {
    mutating func edit(to newText: String) {
        text = newText
    }
}

extension PhotoMessage: Editable, Downloadable {
    mutating func edit(to newText: String) {
        caption = newText
    }
}

extension VoiceMessage: Downloadable {}

// 4. Строка во вкладке "Файлы"
func fileRow(for file: any Message & Downloadable) -> String {
    return "\(file.fileSizeKB) КБ - \(file.preview()) (\(file.sender))"
}

// 5. Пункты меню по долгому нажатию
func menuActions(for message: any Message) -> [String] {
    var actions = ["Ответить"]
    // Добавь "Изменить" и "Скачать" для сообщений с этими ролями
    if message is any Editable {
        actions.append("Изменить")
    }
    if message is any Downloadable {
        actions.append("Скачать")
    }
    return actions
}

var note = TextMessage(sender: "Билол", text: "Встречаемся в 18:00")
let photo = PhotoMessage(sender: "Мама", caption: "Рецепт пирога", fileSizeKB: 2048)
let voice = VoiceMessage(sender: "Сестра", seconds: 35, fileSizeKB: 310)

note.edit(to: "Встречаемся в 18:30")
print(note.preview())

let chat: [any Message] = [note, photo, voice]
for message in chat {
    print(menuActions(for: message))
}

let files: [any Message & Downloadable] = [photo, voice]
for file in files {
    print(fileRow(for: file))
}
```

## @output
```
Встречаемся в 18:30
["Ответить", "Изменить"]
["Ответить", "Изменить", "Скачать"]
["Ответить", "Скачать"]
2048 КБ - Фото: Рецепт пирога (Мама)
310 КБ - Голосовое сообщение, 35 сек. (Сестра)
```

## @tests
```swift
// Новые виды сообщений: документ (только скачать) и опрос (только изменить)
struct __t_Document: Message, Downloadable {
    let sender: String
    let fileName: String
    let fileSizeKB: Int

    func preview() -> String {
        return "Файл: \(fileName)"
    }
}

struct __t_Poll: Editable {
    let sender: String
    var question: String

    func preview() -> String {
        return "Опрос: \(question)"
    }

    mutating func edit(to newText: String) {
        question = newText
    }
}

var __t_text: any Editable = TextMessage(sender: "Билол", text: "Опаздываю")
__t_text.edit(to: "Опаздываю на 10 минут")
__eq("Текст через any Editable: после правки новое превью", __t_text.preview(), "Опаздываю на 10 минут", hint: "В расширении TextMessage метод edit(to:) записывает newText в text")
__eq("Через any Editable виден и отправитель - Editable наследует Message", __t_text.sender, "Билол")

var __t_photo: any Editable = PhotoMessage(sender: "Мама", caption: "Пирог", fileSizeKB: 900)
__t_photo.edit(to: "Пирог с вишней")
__eq("Фото через any Editable: правка меняет подпись", __t_photo.preview(), "Фото: Пирог с вишней", hint: "В расширении PhotoMessage метод edit(to:) записывает newText в caption")
__t_photo.edit(to: "")
__eq("Фото: подпись стёрли - превью просто Фото", __t_photo.preview(), "Фото")

let __t_voice = VoiceMessage(sender: "Сестра", seconds: 12, fileSizeKB: 120)
__ok("Голосовое нельзя изменить", !((__t_voice as Any) is any Editable), hint: "VoiceMessage подписан только на Downloadable")
__ok("Голосовое можно скачать", (__t_voice as Any) is any Downloadable, hint: "Подпиши VoiceMessage на Downloadable: extension VoiceMessage: Downloadable {}")
__ok("Текст нельзя скачать", !((TextMessage(sender: "Билол", text: "Ок") as Any) is any Downloadable), hint: "TextMessage подписан только на Editable")

__eq("Меню текста", menuActions(for: TextMessage(sender: "Билол", text: "Ок")), ["Ответить", "Изменить"], hint: "Для Editable добавь Изменить после Ответить")
__eq("Меню фото", menuActions(for: PhotoMessage(sender: "Мама", caption: "", fileSizeKB: 500)), ["Ответить", "Изменить", "Скачать"], hint: "Порядок: Ответить, Изменить, Скачать")
__eq("Меню голосового", menuActions(for: __t_voice), ["Ответить", "Скачать"], hint: "Для Downloadable добавь Скачать")
__eq("Меню документа, которого нет в твоём коде", menuActions(for: __t_Document(sender: "Коллега", fileName: "Отчёт.pdf", fileSizeKB: 640)), ["Ответить", "Скачать"], hint: "Проверяй роль через is any Downloadable, а не конкретный тип")
__eq("Меню опроса, которого нет в твоём коде", menuActions(for: __t_Poll(sender: "Подруга", question: "Кино или театр?")), ["Ответить", "Изменить"], hint: "Проверяй роль через is any Editable, а не конкретный тип")

__eq("Строка файла: фото", fileRow(for: PhotoMessage(sender: "Мама", caption: "Дача", fileSizeKB: 1500)), "1500 КБ - Фото: Дача (Мама)", hint: "Размер, пробел, КБ, пробел, дефис, пробел, превью и отправитель в скобках")
__eq("Строка файла: голосовое", fileRow(for: __t_voice), "120 КБ - Голосовое сообщение, 12 сек. (Сестра)")
__eq("Строка файла: документ", fileRow(for: __t_Document(sender: "Коллега", fileName: "Отчёт.pdf", fileSizeKB: 640)), "640 КБ - Файл: Отчёт.pdf (Коллега)")
```

## @rules
- must: /\bprotocol\s+Editable\s*:\s*Message\b/ :: `Editable` должен наследовать `Message`: `protocol Editable: Message { ... }`.
- must: /\bmutating\s+func\s+edit\s*\(\s*to\s+newText\s*:\s*String\s*\)\s*$/m :: В протоколе `Editable` требование записывается так: `mutating func edit(to newText: String)`.
- must: /\bextension\s+TextMessage\s*:/ :: Подпиши `TextMessage` на `Editable` в расширении: `extension TextMessage: Editable { ... }`.
- must: /\bextension\s+PhotoMessage\s*:/ :: Подпиши `PhotoMessage` на роли в расширении: `extension PhotoMessage: Editable, Downloadable { ... }`.
- must: /\bextension\s+VoiceMessage\s*:/ :: Подпиши `VoiceMessage` на `Downloadable` в расширении: `extension VoiceMessage: Downloadable {}`.
- must: /\bfor\s+\w+\s*:\s*any\s+Message\s*&\s*Downloadable\b/ :: Параметр `fileRow(for:)` должен иметь тип `any Message & Downloadable`.
- mustnot: /\b(is|as\?|as!)\s+(TextMessage|PhotoMessage|VoiceMessage)\b/ :: В меню спрашивай про роли (`is any Editable`), а не про конкретные виды сообщений.

## @hint1
Сначала два протокола. `Downloadable` совсем короткий: одно требование свойства, которое читается. `Editable` после имени через двоеточие указывает `Message` — так он наследует его требования. Внутри одно требование метода: слово `mutating`, затем `func`, имя, метка `to` и внутреннее имя параметра. Тела нет.

Потом роли. Для каждой структуры напиши расширение, в котором после имени типа через двоеточие перечислены её роли. Для `Editable` внутри нужен метод `edit(to:)` — уже с телом, со словом `mutating` и присваиванием нового текста в нужное свойство. Для `Downloadable` писать ничего не нужно: свойство `fileSizeKB` у структур уже есть. Поэтому расширение для голосового — пустые фигурные скобки.

`fileRow(for:)` — одна строка с интерполяцией. Тип параметра — два протокола через `&` после слова `any`. Благодаря этому внутри доступны и `fileSizeKB`, и `preview()`, и `sender`.

В `menuActions(for:)` два `if`. В каждом спроси оператором `is`, играет ли сообщение роль: `any` и имя протокола. Если да — добавь пункт в массив.

## @hint2
Наследование протокола, `mutating`-требование и подпись в расширении:

```swift
protocol Admin: Participant {
    var canPin: Bool { get }
}

protocol Subscriber {
    mutating func toggleNotifications()
}

extension ChannelReader: Subscriber {
    mutating func toggleNotifications() {
        notificationsOn = !notificationsOn
    }
}
```

Параметр, который играет две роли, и вопрос о роли:

```swift
func settingsLine(for user: any Participant & Subscriber) -> String { ... }

if user is any Admin { ... }
```

## @hint3
Протоколы готовы. Заполни пропуски:

```swift
protocol Downloadable {
    var fileSizeKB: Int { get }
}

protocol Editable: Message {
    mutating func edit(to newText: String)
}

extension TextMessage: Editable {
    mutating func edit(to newText: String) {
        text = newText
    }
}

extension PhotoMessage: Editable, ___ {
    mutating func edit(to newText: String) {
        ___ = newText
    }
}

extension VoiceMessage: Downloadable {}

func fileRow(for file: ___) -> String {
    return "\(file.fileSizeKB) КБ - \(file.preview()) (\(file.sender))"
}

func menuActions(for message: any Message) -> [String] {
    var actions = ["Ответить"]
    if message is any Editable {
        actions.append("Изменить")
    }
    if ___ {
        actions.append("Скачать")
    }
    return actions
}
```

В первом пропуске — вторая роль фото. Во втором — свойство фото, которое меняет правка. В третьем — композиция двух протоколов. В четвёртом — вопрос, можно ли скачать сообщение.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** `Downloadable` и `Editable` — две роли. `Editable` наследует `Message`, поэтому всё, что можно изменить, обязательно ещё и сообщение: у него есть `sender` и `preview()`. Проверка опиралась на это, когда вызывала `preview()` у `any Editable`.

Роли раздаются в расширениях. `TextMessage` и `PhotoMessage` получают `edit(to:)`, каждый меняет своё свойство. Требование помечено `mutating`, потому что структура меняет себя. Без этого слова в протоколе `mutating`-метод структуры не подошёл бы под требование. `VoiceMessage` и `PhotoMessage` уже имели `fileSizeKB`, поэтому для `Downloadable` хватило подписи.

`fileRow(for:)` принимает `any Message & Downloadable` — только то, что одновременно и сообщение, и файл. Текст сюда не передать: Swift остановит ещё до запуска. А `menuActions` спрашивает о ролях через `is any Editable` и `is any Downloadable`, поэтому сработала даже для документа и опроса, которых в твоём коде нет.

**Почему маленькие роли, а не один большой протокол.** Если бы `Message` требовал и `edit`, и `fileSizeKB`, голосовому пришлось бы притворяться, что его можно изменить, а тексту — что у него есть размер файла. Маленькие роли честно описывают, кто что умеет.

**Типичные ошибки:**

- `protocol Editable` без `: Message` — тогда у `any Editable` нет `preview()`;
- в требовании забыт `mutating` — Swift сообщит, что `TextMessage` не выполняет требования `Editable`;
- в `menuActions` проверка `message is TextMessage || message is PhotoMessage` — новые виды сообщений меню не увидит;
- в `edit(to:)` у фото меняется не `caption`, а что-то ещё — подпись на экране останется прежней.
