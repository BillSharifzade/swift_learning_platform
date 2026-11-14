---
title: Движок чата
concept: Итог курса — протоколы, слабый делегат, связанные значения, Codable
---

## @description

### Контекст
Приложение «Двор» — чат соседей одного дома: объявления, фото найденных ключей, опросы про субботник. Тебе поручили движок комнаты чата — то, что живёт под экраном и в любом приложении-мессенджере устроено похоже.

Тикет от тимлида:

- сообщения бывают разных видов: текст, фото, стикер, опрос — и для каждого нужна короткая строка для списка чатов;
- при плохой связи сервер присылает одно и то же сообщение дважды — дубликаты нужно отбрасывать;
- о новых сообщениях комната сообщает **делегату** — экрану чата или значку непрочитанных на иконке;
- историю нужно сохранять в JSON и загружать обратно.

И отдельная строка: «В прошлой версии комната держала экран сильной ссылкой, и закрытые экраны висели в памяти. Не повторяй».

### Что пригодится
- **Перечисление со связанными значениями** и `switch` с `let`: `case .photo(_, let sizeKB):` — ненужное значение заменяют `_`.
- **Делегат.** Протокол с пометкой `AnyObject` могут принимать только классы. Свойство-делегат объявляют `weak var`: слабая ссылка не удерживает объект и сама становится `nil`, когда объект исчезает. Вызов — через `?.`: `delegate?.something(self)`.
- **Codable.** Если все свойства типа умеют кодироваться, Swift сам пишет код превращения в JSON. Даже перечисление со связанными значениями: `.sticker(name: "котик")` становится `{"sticker":{"name":"котик"}}`.
- **Строки и данные.** `Data(text.utf8)` — байты из строки, `String(decoding: data, as: UTF8.self)` — строка из байтов. `String(text.prefix(5))` — первые пять символов.

Пример на других данных — заметки:

```swift
import Foundation

struct Note: Codable, Equatable {
    let id: Int
    let text: String
}

let encoder = JSONEncoder()
encoder.outputFormatting = .sortedKeys
let data = try encoder.encode([Note(id: 1, text: "Купить хлеб")])
let json = String(decoding: data, as: UTF8.self)
// [{"id":1,"text":"Купить хлеб"}]

let notes = try JSONDecoder().decode([Note].self, from: Data(json.utf8))
```

```swift
protocol PlayerDelegate: AnyObject {
    func playerDidFinish(_ player: Player)
}

final class Player {
    weak var delegate: PlayerDelegate?
    func finish() {
        delegate?.playerDidFinish(self)
    }
}
```

### Задача
Типы `MessageContent`, `ChatMessage`, протокол `ChatRoomDelegate` и заготовки классов уже есть. Допиши всё, что помечено `TODO`.

1. `var preview: String` у `MessageContent`:
   - текст длиной до 30 символов включительно — сам текст; длиннее — первые 30 символов и `...`;
   - фото — `Фото (340 КБ)`;
   - стикер — `Стикер: котик`;
   - опрос — `Опрос: Когда субботник? (вариантов: 3)`.
2. Сделай `delegate` в `ChatRoom` слабой ссылкой.
3. `func receive(_ message: ChatMessage) -> Bool`:
   - если сообщение с таким `id` уже есть — вернуть `false`, больше ничего не делать;
   - добавить сообщение; `messages` всегда упорядочены по `sentAt`, при равном `sentAt` — по `id`;
   - сообщить делегату: `chatRoom(_:didReceive:)`;
   - если автор не `currentUser`, увеличить `unreadCount` на 1 и сообщить делегату `chatRoomDidChangeUnreadCount(_:)`;
   - вернуть `true`.
4. `func markAllRead()` — обнуляет `unreadCount` и сообщает делегату об изменении. Если счётчик и так `0`, ничего не делает и делегату не пишет.
5. `var lastPreview: String` — для последнего сообщения: `Вы: ` и превью, если автор — `currentUser`, иначе логин автора, двоеточие, пробел и превью: `night_owl: Фото (340 КБ)`. Пустая комната — `Сообщений пока нет`.
6. `func exportJSON() throws -> String` — массив `messages` в JSON. Используй `JSONEncoder` с `outputFormatting = .sortedKeys` и больше ничего не настраивай.
7. `func importJSON(_ json: String) throws -> Int` — разбирает JSON-массив сообщений и принимает каждое через `receive`. Возвращает, сколько сообщений действительно добавлено. Если JSON испорчен, ошибка разбора пробрасывается, и в комнате ничего не меняется.
8. `UnreadBadge` — значок непрочитанных. В `chatRoomDidChangeUnreadCount(_:)` он обновляет `text` по `room.unreadCount`: `0` — пустая строка, от 1 до 99 — само число, больше 99 — `99+`.

### Пример
```swift
let room = ChatRoom(title: "Дом 12", currentUser: "bilol")
let badge = UnreadBadge()
room.delegate = badge

room.receive(ChatMessage(id: 1, author: "night_owl", sentAt: 540, content: .sticker(name: "котик")))  // true
room.receive(ChatMessage(id: 1, author: "night_owl", sentAt: 540, content: .sticker(name: "котик")))  // false
badge.text          // "1"
room.lastPreview    // "night_owl: Стикер: котик"
room.markAllRead()
badge.text          // ""
try room.exportJSON()
// [{"author":"night_owl","content":{"sticker":{"name":"котик"}},"id":1,"sentAt":540}]
```

## @starter
```swift
import Foundation

// Содержимое сообщения. Codable: Swift сам превращает его в JSON и обратно
enum MessageContent: Codable, Equatable {
    case text(body: String)
    case photo(fileName: String, sizeKB: Int)
    case sticker(name: String)
    case poll(question: String, options: [String])

    // 1. Короткий текст для списка чатов
    var preview: String {
        // TODO
        return ""
    }
}

// Сообщение. sentAt — время отправки: чем больше число, тем позже
struct ChatMessage: Codable, Equatable {
    let id: Int
    let author: String   // логин автора
    let sentAt: Int
    let content: MessageContent
}

// Кому комната сообщает о событиях: экрану чата, значку на иконке
protocol ChatRoomDelegate: AnyObject {
    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage)
    func chatRoomDidChangeUnreadCount(_ room: ChatRoom)
}

final class ChatRoom {
    let title: String
    let currentUser: String   // логин того, кто открыл приложение
    // 2. Комната не должна удерживать делегата
    var delegate: ChatRoomDelegate?
    private(set) var messages: [ChatMessage] = []
    private(set) var unreadCount = 0

    init(title: String, currentUser: String) {
        self.title = title
        self.currentUser = currentUser
    }

    // 3. Принять сообщение. Повтор id — false
    func receive(_ message: ChatMessage) -> Bool {
        // TODO
        return false
    }

    // 4. Прочитать все
    func markAllRead() {
        // TODO
    }

    // 5. Последнее сообщение для списка чатов
    var lastPreview: String {
        // TODO
        return ""
    }

    // 6. История в JSON (ключи по алфавиту)
    func exportJSON() throws -> String {
        // TODO
        return ""
    }

    // 7. Загрузить историю из JSON. Возвращает, сколько сообщений добавлено
    func importJSON(_ json: String) throws -> Int {
        // TODO
        return 0
    }
}

// 8. Значок непрочитанных на иконке приложения
final class UnreadBadge: ChatRoomDelegate {
    private(set) var text = ""

    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage) {
        // Новое сообщение значку не важно: его интересует только счётчик
    }

    func chatRoomDidChangeUnreadCount(_ room: ChatRoom) {
        // TODO
    }
}

// Экран чата: печатает события, чтобы было видно, что происходит
final class ChatScreen: ChatRoomDelegate {
    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage) {
        print("[\(room.title)] \(message.author): \(message.content.preview)")
    }

    func chatRoomDidChangeUnreadCount(_ room: ChatRoom) {
        print("Непрочитанных: \(room.unreadCount)")
    }
}

// Ответ сервера: история, пока приложение было закрыто
let serverHistory = """
[
  {"id": 1, "author": "night_owl", "sentAt": 540, "content": {"text": {"body": "Кто брал тележку из подъезда?"}}},
  {"id": 2, "author": "bilol", "sentAt": 545, "content": {"text": {"body": "Я, сейчас верну"}}},
  {"id": 3, "author": "dog_walker", "sentAt": 560, "content": {"photo": {"fileName": "keys.jpg", "sizeKB": 340}}},
  {"id": 3, "author": "dog_walker", "sentAt": 560, "content": {"photo": {"fileName": "keys.jpg", "sizeKB": 340}}}
]
"""

let room = ChatRoom(title: "Дом 12", currentUser: "bilol")
let screen = ChatScreen()
room.delegate = screen

do {
    let added = try room.importJSON(serverHistory)
    print("Загружено сообщений: \(added)")
    let poll = MessageContent.poll(question: "Когда субботник?", options: ["Суббота", "Воскресенье", "Не смогу"])
    if !room.receive(ChatMessage(id: 4, author: "night_owl", sentAt: 600, content: poll)) {
        print("Повтор отброшен")
    }
    print(room.lastPreview)
    room.markAllRead()
    print(try room.exportJSON())
} catch {
    print("Ошибка: \(error)")
}
```

## @solution
```swift
import Foundation

// Содержимое сообщения. Codable: Swift сам превращает его в JSON и обратно
enum MessageContent: Codable, Equatable {
    case text(body: String)
    case photo(fileName: String, sizeKB: Int)
    case sticker(name: String)
    case poll(question: String, options: [String])

    // 1. Короткий текст для списка чатов
    var preview: String {
        switch self {
        case .text(let body):
            return body.count > 30 ? String(body.prefix(30)) + "..." : body
        case .photo(_, let sizeKB):
            return "Фото (\(sizeKB) КБ)"
        case .sticker(let name):
            return "Стикер: \(name)"
        case .poll(let question, let options):
            return "Опрос: \(question) (вариантов: \(options.count))"
        }
    }
}

// Сообщение. sentAt — время отправки: чем больше число, тем позже
struct ChatMessage: Codable, Equatable {
    let id: Int
    let author: String   // логин автора
    let sentAt: Int
    let content: MessageContent
}

// Кому комната сообщает о событиях: экрану чата, значку на иконке
protocol ChatRoomDelegate: AnyObject {
    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage)
    func chatRoomDidChangeUnreadCount(_ room: ChatRoom)
}

final class ChatRoom {
    let title: String
    let currentUser: String   // логин того, кто открыл приложение
    // 2. Комната не должна удерживать делегата
    weak var delegate: ChatRoomDelegate?
    private(set) var messages: [ChatMessage] = []
    private(set) var unreadCount = 0

    init(title: String, currentUser: String) {
        self.title = title
        self.currentUser = currentUser
    }

    // 3. Принять сообщение. Повтор id — false
    func receive(_ message: ChatMessage) -> Bool {
        if messages.contains(where: { $0.id == message.id }) {
            return false
        }
        messages.append(message)
        messages.sort { $0.sentAt != $1.sentAt ? $0.sentAt < $1.sentAt : $0.id < $1.id }
        delegate?.chatRoom(self, didReceive: message)
        if message.author != currentUser {
            unreadCount += 1
            delegate?.chatRoomDidChangeUnreadCount(self)
        }
        return true
    }

    // 4. Прочитать все
    func markAllRead() {
        guard unreadCount > 0 else {
            return
        }
        unreadCount = 0
        delegate?.chatRoomDidChangeUnreadCount(self)
    }

    // 5. Последнее сообщение для списка чатов
    var lastPreview: String {
        guard let last = messages.last else {
            return "Сообщений пока нет"
        }
        let who = last.author == currentUser ? "Вы" : last.author
        return "\(who): \(last.content.preview)"
    }

    // 6. История в JSON (ключи по алфавиту)
    func exportJSON() throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        let data = try encoder.encode(messages)
        return String(decoding: data, as: UTF8.self)
    }

    // 7. Загрузить историю из JSON. Возвращает, сколько сообщений добавлено
    func importJSON(_ json: String) throws -> Int {
        let incoming = try JSONDecoder().decode([ChatMessage].self, from: Data(json.utf8))
        var added = 0
        for message in incoming {
            if receive(message) {
                added += 1
            }
        }
        return added
    }
}

// 8. Значок непрочитанных на иконке приложения
final class UnreadBadge: ChatRoomDelegate {
    private(set) var text = ""

    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage) {
        // Новое сообщение значку не важно: его интересует только счётчик
    }

    func chatRoomDidChangeUnreadCount(_ room: ChatRoom) {
        let count = room.unreadCount
        if count == 0 {
            text = ""
        } else if count > 99 {
            text = "99+"
        } else {
            text = "\(count)"
        }
    }
}

// Экран чата: печатает события, чтобы было видно, что происходит
final class ChatScreen: ChatRoomDelegate {
    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage) {
        print("[\(room.title)] \(message.author): \(message.content.preview)")
    }

    func chatRoomDidChangeUnreadCount(_ room: ChatRoom) {
        print("Непрочитанных: \(room.unreadCount)")
    }
}

// Ответ сервера: история, пока приложение было закрыто
let serverHistory = """
[
  {"id": 1, "author": "night_owl", "sentAt": 540, "content": {"text": {"body": "Кто брал тележку из подъезда?"}}},
  {"id": 2, "author": "bilol", "sentAt": 545, "content": {"text": {"body": "Я, сейчас верну"}}},
  {"id": 3, "author": "dog_walker", "sentAt": 560, "content": {"photo": {"fileName": "keys.jpg", "sizeKB": 340}}},
  {"id": 3, "author": "dog_walker", "sentAt": 560, "content": {"photo": {"fileName": "keys.jpg", "sizeKB": 340}}}
]
"""

let room = ChatRoom(title: "Дом 12", currentUser: "bilol")
let screen = ChatScreen()
room.delegate = screen

do {
    let added = try room.importJSON(serverHistory)
    print("Загружено сообщений: \(added)")
    let poll = MessageContent.poll(question: "Когда субботник?", options: ["Суббота", "Воскресенье", "Не смогу"])
    if !room.receive(ChatMessage(id: 4, author: "night_owl", sentAt: 600, content: poll)) {
        print("Повтор отброшен")
    }
    print(room.lastPreview)
    room.markAllRead()
    print(try room.exportJSON())
} catch {
    print("Ошибка: \(error)")
}
```

## @tests
```swift
final class __t_Spy: ChatRoomDelegate {
    var events: [String] = []
    func chatRoom(_ room: ChatRoom, didReceive message: ChatMessage) {
        events.append("сообщение \(message.id)")
    }
    func chatRoomDidChangeUnreadCount(_ room: ChatRoom) {
        events.append("счётчик \(room.unreadCount)")
    }
}
func __t_msg(_ id: Int, _ author: String, _ sentAt: Int, _ text: String = "Привет") -> ChatMessage {
    ChatMessage(id: id, author: author, sentAt: sentAt, content: .text(body: text))
}
func __t_attachTemporaryDelegate(to room: ChatRoom) {
    let spy = __t_Spy()
    room.delegate = spy
}

__eq("Превью: короткий текст без изменений", MessageContent.text(body: "Кто брал тележку из подъезда?").preview, "Кто брал тележку из подъезда?")
__eq("Превью: ровно 30 символов — без обрезки", MessageContent.text(body: "Шлагбаум сломался, звоним в УК").preview, "Шлагбаум сломался, звоним в УК", hint: "Обрезать нужно, только если символов больше 30")
__eq("Превью: 31 символ — 30 символов и многоточие", MessageContent.text(body: "Во дворе нашли ключи с брелоком").preview, "Во дворе нашли ключи с брелоко...", hint: "Возьми первые 30 символов: String(body.prefix(30)), и добавь три точки")
__eq("Превью: длинный текст", MessageContent.text(body: "Завтра отключат горячую воду с 10 до 18, набирайте заранее").preview, "Завтра отключат горячую воду с...")
__eq("Превью: фото", MessageContent.photo(fileName: "car.png", sizeKB: 1250).preview, "Фото (1250 КБ)", hint: "Имя файла в превью не нужно: case .photo(_, let sizeKB)")
__eq("Превью: стикер", MessageContent.sticker(name: "спасибо").preview, "Стикер: спасибо")
__eq("Превью: опрос", MessageContent.poll(question: "Ставим велопарковку?", options: ["Да", "Нет"]).preview, "Опрос: Ставим велопарковку? (вариантов: 2)")

let __t_room = ChatRoom(title: "Тест", currentUser: "bilol")
let __t_spy = __t_Spy()
__t_room.delegate = __t_spy
__eq("Новое сообщение принято: true", __t_room.receive(__t_msg(10, "night_owl", 700)), true)
__eq("Повтор id: false", __t_room.receive(__t_msg(10, "night_owl", 700, "Другой текст")), false, hint: "Если в messages уже есть сообщение с таким id, верни false и ничего не меняй")
__eq("Делегат: событие о сообщении, потом счётчик", __t_spy.events, ["сообщение 10", "счётчик 1"], hint: "Сначала chatRoom(_:didReceive:), потом, для чужого сообщения, unreadCount += 1 и chatRoomDidChangeUnreadCount. Для повтора — никаких событий")
__eq("Своё сообщение не увеличивает счётчик", { _ = __t_room.receive(__t_msg(11, "bilol", 650)); return __t_room.unreadCount }(), 1, hint: "Счётчик растёт, только если автор не равен currentUser")
_ = __t_room.receive(__t_msg(13, "dog_walker", 680))
_ = __t_room.receive(__t_msg(12, "dog_walker", 680))
__eq("Сообщения упорядочены по sentAt, при равенстве по id", __t_room.messages.map { $0.id }, [11, 12, 13, 10], hint: "После добавления отсортируй messages: сначала по sentAt, при равном sentAt — по id")
__eq("Непрочитанных три", __t_room.unreadCount, 3)
__t_spy.events = []
__t_room.markAllRead()
__t_room.markAllRead()
__eq("Прочитать все: счётчик 0, делегату одно событие", "\(__t_room.unreadCount) \(__t_spy.events)", "0 [\"счётчик 0\"]", hint: "Обнули счётчик и сообщи делегату. Если счётчик уже 0 — ничего не делай")
__eq("Последнее сообщение чужое", __t_room.lastPreview, "night_owl: Привет")
_ = __t_room.receive(ChatMessage(id: 20, author: "bilol", sentAt: 900, content: .sticker(name: "ок")))
__eq("Последнее сообщение своё", __t_room.lastPreview, "Вы: Стикер: ок", hint: "Если автор — currentUser, вместо логина пишется Вы")
__eq("Пустая комната", ChatRoom(title: "Пусто", currentUser: "bilol").lastPreview, "Сообщений пока нет")

let __t_weakRoom = ChatRoom(title: "Слабая ссылка", currentUser: "bilol")
__t_attachTemporaryDelegate(to: __t_weakRoom)
__ok("Комната не удерживает делегата", __t_weakRoom.delegate == nil, hint: "Объяви delegate как weak var: экран закрылся — ссылка сама стала nil")

let __t_badgeRoom = ChatRoom(title: "Значок", currentUser: "bilol")
let __t_badge = UnreadBadge()
__t_badgeRoom.delegate = __t_badge
_ = __t_badgeRoom.receive(__t_msg(1, "night_owl", 1))
_ = __t_badgeRoom.receive(__t_msg(2, "night_owl", 2))
__eq("Значок: 2 непрочитанных", __t_badge.text, "2", hint: "В chatRoomDidChangeUnreadCount возьми room.unreadCount и запиши его в text")
for __t_i in 3...99 {
    _ = __t_badgeRoom.receive(__t_msg(__t_i, "night_owl", __t_i))
}
__eq("Значок: ровно 99", __t_badge.text, "99", hint: "99 ещё показывается числом, 99+ — только когда больше 99")
_ = __t_badgeRoom.receive(__t_msg(100, "night_owl", 100))
__eq("Значок: 100 — это 99+", __t_badge.text, "99+")
__t_badgeRoom.markAllRead()
__eq("Значок: всё прочитано — пусто", __t_badge.text, "")

let __t_exportRoom = ChatRoom(title: "Экспорт", currentUser: "bilol")
_ = __t_exportRoom.receive(ChatMessage(id: 5, author: "bilol", sentAt: 30, content: .text(body: "Привет")))
do {
    __eq("Экспорт: JSON с ключами по алфавиту", try __t_exportRoom.exportJSON(), "[{\"author\":\"bilol\",\"content\":{\"text\":{\"body\":\"Привет\"}},\"id\":5,\"sentAt\":30}]", hint: "Используй JSONEncoder с outputFormatting = .sortedKeys и преврати Data в строку: String(decoding: data, as: UTF8.self)")
    let __t_json = try __t_room.exportJSON()
    let __t_back = try JSONDecoder().decode([ChatMessage].self, from: Data(__t_json.utf8))
    __eq("Экспорт: из JSON получаются те же сообщения", __t_back, __t_room.messages, hint: "Кодируй весь массив messages")
} catch {
    __fail("Экспорт в JSON", "exportJSON бросил ошибку: \(error)")
}

let __t_importRoom = ChatRoom(title: "Импорт", currentUser: "bilol")
let __t_server = "[{\"id\":2,\"author\":\"dog_walker\",\"sentAt\":50,\"content\":{\"poll\":{\"question\":\"Субботник?\",\"options\":[\"Да\",\"Нет\"]}}},{\"id\":1,\"author\":\"bilol\",\"sentAt\":40,\"content\":{\"text\":{\"body\":\"Всем привет\"}}},{\"id\":2,\"author\":\"dog_walker\",\"sentAt\":50,\"content\":{\"poll\":{\"question\":\"Субботник?\",\"options\":[\"Да\",\"Нет\"]}}}]"
do {
    __eq("Импорт: добавлено 2 из 3 (один повтор)", try __t_importRoom.importJSON(__t_server), 2, hint: "Принимай каждое сообщение через receive и считай только те, где receive вернул true")
    __eq("Импорт: сообщения упорядочены", __t_importRoom.messages.map { $0.id }, [1, 2])
    __eq("Импорт: опрос разобран целиком", __t_importRoom.messages.last?.content, .poll(question: "Субботник?", options: ["Да", "Нет"]))
    __eq("Импорт: чужое сообщение стало непрочитанным", __t_importRoom.unreadCount, 1)
} catch {
    __fail("Импорт из JSON", "importJSON бросил ошибку на правильном JSON: \(error)")
}
do {
    _ = try __t_importRoom.importJSON("[{\"id\": 3, \"author\": ")
    __fail("Испорченный JSON — ошибка", "importJSON должен пробросить ошибку разбора: try перед decode, без try?")
} catch {
    __eq("Испорченный JSON — ошибка, комната не изменилась", __t_importRoom.messages.count, 2)
}
```

## @rules
- must: /\bweak\s+var\s+delegate\b/ :: Делегат должен быть слабой ссылкой: `weak var delegate: ChatRoomDelegate?`.
- mustnot: /\btry[?!]/ :: Не глуши ошибки через `try?` или `try!`: в `exportJSON` и `importJSON` пробрасывай их обычным `try`.

## @hint1
Иди по номерам.

Превью — `switch self` с четырьмя случаями. Связанные значения достаются через `let` прямо в `case`, ненужные заменяются `_`. Для текста сравни количество символов с 30: если больше — первые 30 символов и три точки.

Делегат — одно слово перед `var`.

`receive`: сначала проверь через `contains(where:)`, нет ли такого `id`. Потом добавь сообщение и отсортируй массив с двумя правилами: по времени, а при равном времени — по `id`. Потом сообщи делегату о сообщении, а если автор чужой — увеличь счётчик и сообщи об изменении счётчика. Делегата вызывай через `?.`: его может и не быть.

`markAllRead` — `guard` на нулевой счётчик, обнуление, сообщение делегату. `lastPreview` — `guard let` для последнего сообщения и выбор между «Вы» и логином.

JSON: в экспорте создай кодировщик, включи сортировку ключей, закодируй `messages` и преврати байты в строку. В импорте — наоборот: из строки байты, из байтов массив `[ChatMessage]`, затем цикл с `receive` и счётчиком добавленных.

Значок — три варианта по числу `room.unreadCount`.

## @hint2
Связанные значения и сортировка с двумя правилами:

```swift
case .photo(_, let sizeKB):
    return "Фото (\(sizeKB) КБ)"
```

```swift
messages.sort { $0.sentAt != $1.sentAt ? $0.sentAt < $1.sentAt : $0.id < $1.id }
```

Экспорт и импорт:

```swift
let encoder = JSONEncoder()
encoder.outputFormatting = .sortedKeys
let data = try encoder.encode(messages)
return String(decoding: data, as: UTF8.self)
```

```swift
let incoming = try JSONDecoder().decode([ChatMessage].self, from: Data(json.utf8))
```

## @hint3
Превью, `markAllRead`, экспорт и значок пишутся по прошлым подсказкам. Заполни пропуски в остальном:

```swift
weak var delegate: ChatRoomDelegate?

func receive(_ message: ChatMessage) -> Bool {
    if messages.contains(where: { $0.id == message.id }) {
        return false
    }
    messages.append(message)
    messages.sort { $0.sentAt != $1.sentAt ? $0.sentAt < $1.sentAt : $0.id < $1.id }
    delegate?.chatRoom(self, didReceive: message)
    if message.author != currentUser {
        unreadCount += 1
        ___
    }
    return true
}

var lastPreview: String {
    guard let last = messages.last else {
        return "Сообщений пока нет"
    }
    let who = last.author == currentUser ? ___ : last.author
    return "\(who): \(last.content.preview)"
}

func importJSON(_ json: String) throws -> Int {
    let incoming = try JSONDecoder().decode([ChatMessage].self, from: Data(json.utf8))
    var added = 0
    for message in incoming {
        if ___ {
            added += 1
        }
    }
    return added
}
```

В первом пропуске — сообщение делегату об изменении счётчика. Во втором — что писать вместо своего логина. В третьем — вызов, который принимает сообщение и отвечает, добавлено ли оно.

## @hint4
Вот готовое решение:

{{solution}}

**Почему делегат слабый.** Экран чата держит комнату, а комната — экран. Если обе ссылки сильные, получится цикл: после закрытия экрана ни один из объектов не исчезнет. `weak` разрывает цикл: комната может обратиться к экрану, пока он жив, но не продлевает ему жизнь. Проверка как раз создаёт делегата во временной функции и смотрит, стала ли ссылка `nil`. Пометка `AnyObject` в протоколе разрешает `weak`: слабыми бывают только ссылки на классы.

**Почему комната не знает, кто её делегат.** Экрану, значку и проверке комната говорит одно и то же через протокол. Значок сам решает, что делать с числом, экран — что печатать. Добавить третьего слушателя можно, не трогая комнату.

**Почему `receive` возвращает `Bool`.** Дубликаты — обычное дело при плохой связи. Ответ `false` позволяет `importJSON` честно посчитать, сколько сообщений добавилось, без отдельной логики. А так как импорт идёт через `receive`, сортировка, счётчик и делегат работают и для истории с сервера.

**Почему JSON почти не пришлось описывать.** Все поля `ChatMessage` и `MessageContent` умеют кодироваться, поэтому `Codable` работает сам — даже для связанных значений. `sortedKeys` нужен, чтобы порядок ключей всегда был одинаковым: так файлы удобно сравнивать.

**Типичные ошибки:**

- `try?` в `importJSON` — испорченный JSON молча превращается в «ничего не добавлено», и никто не узнает о проблеме;
- счётчик растёт и для своих сообщений — проверь автора;
- `markAllRead` сообщает делегату каждый раз, даже когда счётчик и так был `0`;
- для текста ровно из 30 символов добавляется многоточие — обрезать нужно, только если символов больше 30.
