---
title: Сообщить экрану
concept: Делегирование — протокол делегата, свойство delegate, вызов через ?.
---

## @description

### Контекст
В «Почтальоне» появились быстрые ответы прямо из уведомления: человек пишет пару слов, не открывая приложение. Отправкой занимается класс `MessageSender`. Он проверяет текст и отправляет сообщение, но экран о результате ничего не узнаёт: галочка не появляется, ошибка не показывается.

Решение напрашивается: пусть отправщик сам меняет надпись на экране чата. Но тимлид против: «Отправщиком пользуются три места: экран чата, уведомление и виджет. Если `MessageSender` будет знать про каждый экран, он превратится в кашу. Сделай делегата: отправщик сообщает о событиях "кому-то", а кто это — решают снаружи».

### Новое в Swift
**Делегирование** — это способ одному объекту сообщать другому о том, что произошло, не зная, кто этот другой. «Кто-то» описывается протоколом, а сам объект хранит ссылку на него в свойстве `delegate`. Делегат — значит «доверенное лицо»: ему поручают реагировать на события.

Вот как это выглядит для загрузчика фотографий.

**Шаг 1. Протокол: о чём можно сообщить.**

```swift
protocol PhotoUploaderDelegate {
    func uploadDidFinish(fileName: String)
}
```

**Шаг 2. Объект хранит делегата и сообщает ему о событиях.**

```swift
class PhotoUploader {
    var delegate: (any PhotoUploaderDelegate)?

    func upload(_ fileName: String) {
        // ... здесь файл уходит на сервер ...
        delegate?.uploadDidFinish(fileName: fileName)
    }
}
```

Тип свойства — `(any PhotoUploaderDelegate)?`: «любой, кто подписан на протокол, или никто». Скобки нужны, чтобы знак вопроса относился ко всей записи. Делегата может и не быть, поэтому вызов идёт через знакомый `?.`: если делегат есть — он узнает о событии, если нет — вызов просто пропускается.

**Шаг 3. Экран подписывается на протокол и становится делегатом.**

```swift
class GalleryScreen: PhotoUploaderDelegate {
    var caption = ""

    func uploadDidFinish(fileName: String) {
        caption = "Загружено: \(fileName)"
    }
}

let uploader = PhotoUploader()
let gallery = GalleryScreen()
uploader.delegate = gallery

uploader.upload("dacha.jpg")
print(gallery.caption)   // Загружено: dacha.jpg
```

`PhotoUploader` не знает слова `GalleryScreen`. Завтра делегатом станет другой экран — загрузчик менять не придётся.

Экран здесь — класс, и это важно. В `delegate` попадает ссылка на тот же самый объект `gallery`, поэтому изменения видны снаружи. Будь экран структурой, загрузчик получил бы копию и менял бы её.

> 💡 В настоящих приложениях свойство делегата объявляют со словом `weak`. Зачем — узнаешь в модуле про управление памятью, а пока обычного опционального свойства достаточно.

### Задача
1. Объяви протокол `MessageSenderDelegate` с двумя методами:
   - `didSendMessage(_:number:)` — параметры: текст `String` без метки и `number` типа `Int`;
   - `didFailToSend(_:reason:)` — параметры: текст `String` без метки и `reason` типа `String`.
2. Добавь в `MessageSender` свойство `delegate` типа `(any MessageSenderDelegate)?`.
3. Допиши в методе `send(_:)` сообщения делегату — места отмечены комментариями:
   - пустой текст — `didFailToSend` с причиной `Пустое сообщение`;
   - текст длиннее `maxLength` символов — `didFailToSend` с причиной `Слишком длинное сообщение`. Ровно `maxLength` символов — можно;
   - успешная отправка — `didSendMessage` с текстом и новым значением `sentCount`.
4. Подпиши `ChatScreen` на `MessageSenderDelegate`. Методы меняют `statusLine`:
   - при отправке — `Сообщение 2 отправлено: Привет` (номер и текст);
   - при ошибке — `Не отправлено: ` и причина.

### Пример
Сценарий внизу редактора должен вывести:

```text
Сообщение 1 отправлено: Привет! Как дела?
Не отправлено: Пустое сообщение
Не отправлено: Слишком длинное сообщение
Сообщение 2 отправлено: Во сколько встреча?
Всего отправлено: 2
```

## @starter
```swift
// 1. Протокол делегата: о чём MessageSender сообщает


// Отправка быстрых ответов. О результате сообщает делегату
class MessageSender {
    let maxLength: Int
    var sentCount = 0
    // 2. Свойство delegate


    init(maxLength: Int) {
        self.maxLength = maxLength
    }

    func send(_ text: String) {
        if text.isEmpty {
            // 3. Сообщи делегату: "Пустое сообщение"

            return
        }
        if text.count > maxLength {
            // 3. Сообщи делегату: "Слишком длинное сообщение"

            return
        }
        sentCount += 1
        // 3. Сообщи делегату об отправке: текст и номер sentCount

    }
}

// 4. Экран чата: подпиши на протокол и допиши два метода
class ChatScreen {
    var statusLine = "Сообщений пока нет"

}

// Быстрый ответ из уведомления: не длиннее 30 символов
let sender = MessageSender(maxLength: 30)
let screen = ChatScreen()
sender.delegate = screen

sender.send("Привет! Как дела?")
print(screen.statusLine)
sender.send("")
print(screen.statusLine)
sender.send("Напомни, пожалуйста, во сколько завтра встреча?")
print(screen.statusLine)
sender.send("Во сколько встреча?")
print(screen.statusLine)
print("Всего отправлено: \(sender.sentCount)")
```

## @solution
```swift
// 1. Протокол делегата: о чём MessageSender сообщает
protocol MessageSenderDelegate {
    func didSendMessage(_ text: String, number: Int)
    func didFailToSend(_ text: String, reason: String)
}

// Отправка быстрых ответов. О результате сообщает делегату
class MessageSender {
    let maxLength: Int
    var sentCount = 0
    // 2. Свойство delegate
    var delegate: (any MessageSenderDelegate)?

    init(maxLength: Int) {
        self.maxLength = maxLength
    }

    func send(_ text: String) {
        if text.isEmpty {
            // 3. Сообщи делегату: "Пустое сообщение"
            delegate?.didFailToSend(text, reason: "Пустое сообщение")
            return
        }
        if text.count > maxLength {
            // 3. Сообщи делегату: "Слишком длинное сообщение"
            delegate?.didFailToSend(text, reason: "Слишком длинное сообщение")
            return
        }
        sentCount += 1
        // 3. Сообщи делегату об отправке: текст и номер sentCount
        delegate?.didSendMessage(text, number: sentCount)
    }
}

// 4. Экран чата: подпиши на протокол и допиши два метода
class ChatScreen: MessageSenderDelegate {
    var statusLine = "Сообщений пока нет"

    func didSendMessage(_ text: String, number: Int) {
        statusLine = "Сообщение \(number) отправлено: \(text)"
    }

    func didFailToSend(_ text: String, reason: String) {
        statusLine = "Не отправлено: \(reason)"
    }
}

// Быстрый ответ из уведомления: не длиннее 30 символов
let sender = MessageSender(maxLength: 30)
let screen = ChatScreen()
sender.delegate = screen

sender.send("Привет! Как дела?")
print(screen.statusLine)
sender.send("")
print(screen.statusLine)
sender.send("Напомни, пожалуйста, во сколько завтра встреча?")
print(screen.statusLine)
sender.send("Во сколько встреча?")
print(screen.statusLine)
print("Всего отправлено: \(sender.sentCount)")
```

## @output
```
Сообщение 1 отправлено: Привет! Как дела?
Не отправлено: Пустое сообщение
Не отправлено: Слишком длинное сообщение
Сообщение 2 отправлено: Во сколько встреча?
Всего отправлено: 2
```

## @tests
```swift
// Делегат-шпион: записывает всё, о чём ему сообщили
class __t_Spy: MessageSenderDelegate {
    var events: [String] = []

    func didSendMessage(_ text: String, number: Int) {
        events.append("отправлено \(number): \(text)")
    }

    func didFailToSend(_ text: String, reason: String) {
        events.append("ошибка (\(reason)): \(text)")
    }
}

let __t_sender = MessageSender(maxLength: 10)
let __t_spy = __t_Spy()
__t_sender.delegate = __t_spy

__t_sender.send("Ок")
__eq("Успешная отправка: делегат узнал текст и номер 1", __t_spy.events, ["отправлено 1: Ок"], hint: "После sentCount += 1 вызови delegate?.didSendMessage(text, number: sentCount)")
__t_sender.send("")
__eq("Пустой текст: делегат узнал об ошибке", __t_spy.events.last ?? "", "ошибка (Пустое сообщение): ", hint: "Для пустого текста вызови delegate?.didFailToSend(text, reason: \"Пустое сообщение\")")
__t_sender.send("1234567890")
__eq("Ровно 10 символов при лимите 10: отправлено, номер 2", __t_spy.events.last ?? "", "отправлено 2: 1234567890", hint: "Длина, равная maxLength, допустима. Ошибка только если символов больше")
__t_sender.send("12345678901")
__eq("11 символов при лимите 10: ошибка", __t_spy.events.last ?? "", "ошибка (Слишком длинное сообщение): 12345678901", hint: "Если text.count больше maxLength, вызови didFailToSend с причиной Слишком длинное сообщение и тем же текстом")
__eq("Ошибки не увеличивают счётчик", __t_sender.sentCount, 2, hint: "sentCount растёт только при успешной отправке")
__eq("Делегат получил ровно четыре события, по одному на отправку", __t_spy.events.count, 4, hint: "На каждый вызов send делегат должен узнать ровно об одном событии")

let __t_quiet = MessageSender(maxLength: 5)
__t_quiet.send("abc")
__t_quiet.send("")
__t_quiet.send("abcdefgh")
__eq("Без делегата отправка работает и не падает", __t_quiet.sentCount, 1, hint: "Если делегата нет, вызов через ?. просто пропускается")

let __t_first = __t_Spy()
let __t_second = __t_Spy()
let __t_widget = MessageSender(maxLength: 20)
__t_widget.delegate = __t_first
__t_widget.send("Еду")
__t_widget.delegate = __t_second
__t_widget.send("Уже у подъезда")
__eq("Сменили делегата: старый знает только о первом сообщении", __t_first.events, ["отправлено 1: Еду"])
__eq("Сменили делегата: новый узнал о втором", __t_second.events, ["отправлено 2: Уже у подъезда"], hint: "Сообщай тому делегату, который лежит в свойстве delegate в момент отправки")

let __t_screen = ChatScreen()
__t_screen.didSendMessage("Купил билеты", number: 7)
__eq("Экран: текст после отправки", __t_screen.statusLine, "Сообщение 7 отправлено: Купил билеты", hint: "Формат: Сообщение, номер, отправлено, двоеточие, пробел и текст")
__t_screen.didFailToSend("", reason: "Пустое сообщение")
__eq("Экран: текст после ошибки", __t_screen.statusLine, "Не отправлено: Пустое сообщение", hint: "Формат: Не отправлено, двоеточие, пробел и причина")

let __t_chat = ChatScreen()
let __t_reply = MessageSender(maxLength: 8)
__t_reply.delegate = __t_chat
__t_reply.send("Буду в 7")
__eq("Экран как делегат: отправка доходит до statusLine", __t_chat.statusLine, "Сообщение 1 отправлено: Буду в 7")
__t_reply.send("Буду в 19:30")
__eq("Экран как делегат: ошибка доходит до statusLine", __t_chat.statusLine, "Не отправлено: Слишком длинное сообщение")
```

## @rules
- must: /\bvar\s+delegate\s*:\s*\(\s*any\s+MessageSenderDelegate\s*\)\s*\?/ :: Объяви свойство так: `var delegate: (any MessageSenderDelegate)?`.
- must: /delegate\?\.\s*didFailToSend[\s\S]*delegate\?\.\s*didFailToSend[\s\S]*delegate\?\.\s*didSendMessage/ :: В `send(_:)` три сообщения делегату через `?.`: два `didFailToSend` и одно `didSendMessage`.
- mustnot: /delegate!/ :: Не разворачивай делегата через `!`: если его нет, приложение упадёт. Используй `delegate?.`.

## @hint1
Начни с протокола. Внутри — две первые строки методов, без тел. У обоих первый параметр — текст без метки, поэтому перед его именем стоит подчёркивание. Второй параметр у одного — номер, у другого — причина.

Потом свойство в `MessageSender`. Его тип — протокол в скобках со словом `any` и знак вопроса после скобок: делегата может не быть. Начального значения не нужно, опционал по умолчанию `nil`.

В `send(_:)` три места с комментариями. В каждом обратись к делегату через `?.` и вызови нужный метод. В ошибках передай сам текст и причину словами из условия. При успехе — текст и `sentCount`, который уже увеличен строкой выше.

Наконец, экран. Поставь после имени класса двоеточие и имя протокола и напиши оба метода — уже с телами. В каждом в `statusLine` записывается новая строка через интерполяцию.

## @hint2
Все три части делегирования на примере загрузчика фото:

```swift
protocol PhotoUploaderDelegate {
    func uploadDidFinish(fileName: String)
}

class PhotoUploader {
    var delegate: (any PhotoUploaderDelegate)?

    func upload(_ fileName: String) {
        delegate?.uploadDidFinish(fileName: fileName)
    }
}

class GalleryScreen: PhotoUploaderDelegate {
    var caption = ""

    func uploadDidFinish(fileName: String) {
        caption = "Загружено: \(fileName)"
    }
}
```

У тебя в протоколе два метода, и у первого параметра нет метки: `_ text: String`.

## @hint3
Протокол и свойство готовы. Заполни пропуски в `send(_:)` и допиши экран:

```swift
protocol MessageSenderDelegate {
    func didSendMessage(_ text: String, number: Int)
    func didFailToSend(_ text: String, reason: String)
}
```

```swift
    var delegate: (any MessageSenderDelegate)?
```

```swift
    func send(_ text: String) {
        if text.isEmpty {
            delegate?.didFailToSend(text, reason: "Пустое сообщение")
            return
        }
        if text.count > maxLength {
            delegate?.___(text, reason: "Слишком длинное сообщение")
            return
        }
        sentCount += 1
        ___
    }
```

```swift
class ChatScreen: ___ {
    var statusLine = "Сообщений пока нет"

    func didSendMessage(_ text: String, number: Int) {
        statusLine = "Сообщение \(number) отправлено: \(text)"
    }

    func didFailToSend(_ text: String, reason: String) {
        statusLine = "Не отправлено: \(reason)"
    }
}
```

В первом пропуске — метод для ошибки. Во втором — вызов `didSendMessage` у делегата с текстом и `sentCount`. В третьем — имя протокола.

## @hint4
Вот готовое решение:

{{solution}}

**Как это работает.** Протокол `MessageSenderDelegate` описывает два события, о которых может рассказать отправщик. `MessageSender` хранит делегата в опциональном свойстве и в нужные моменты вызывает его методы через `?.`. Экран чата подписан на протокол, поэтому строка `sender.delegate = screen` допустима. После неё каждое событие отправщика попадает в методы `ChatScreen`, и те обновляют `statusLine`.

**Почему так, а не напрямую.** Внутри `MessageSender` нет ни слова про `ChatScreen`. Он знает только «есть кто-то, подписанный на `MessageSenderDelegate`». Проверка воспользовалась этим: подставила своего делегата-шпиона, который просто записывает события, и убедилась, что отправщик сообщает обо всём правильно. Так же завтра делегатом станет виджет или уведомление.

**Почему `?.`.** Делегата может не быть: отправщик создали, а экран ещё не подключили. `delegate?.didSendMessage(...)` в этом случае ничего не делает, и программа спокойно продолжает работу. `delegate!` уронил бы приложение.

**Почему `ChatScreen` — класс.** В `delegate` лежит ссылка на тот же объект, что и в `screen`. Поэтому изменения `statusLine` видны в сценарии. Структура в этом месте скопировалась бы, и экран остался бы без изменений.

**Типичные ошибки:**

- `didSendMessage` вызван до `sentCount += 1` — первое сообщение получит номер 0;
- `text.count >= maxLength` — сообщение ровно на 30 символов ошибочно считается слишком длинным;
- забыт `return` после сообщения об ошибке — делегат узнает и об ошибке, и об отправке;
- в протоколе у первого параметра нет `_` — тогда вызывать придётся `didSendMessage(text: ...)`, и экран с проверкой не совпадут с условием.
