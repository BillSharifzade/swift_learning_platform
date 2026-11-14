---
title: Умная папка
concept: Рекурсивные перечисления (indirect) и продвинутое сопоставление с образцом
---

## @description

### Контекст
В «Чернилах» появляются умные папки. Это не обычная папка, а правило: «заметки с тегом "работа", но без тега "архив"» или «закреплённые или с тегом "срочно"». Папка сама собирает заметки, которые подходят под правило.

Правила вкладываются друг в друга: внутри «и» может стоять «не», внутри «не» — «или», и так сколько угодно уровней. Тимлид уже набросал перечисление `Rule`, но оно не собирается. Нужно его починить, научить проверять заметку и составлять человеческое описание для заголовка папки.

### Новое в Swift
**Рекурсивное перечисление.** Иногда случай перечисления хранит значение того же перечисления. Например, ответ в чате ссылается на сообщение, которое тоже может быть ответом:

```swift
indirect enum Message {
    case text(String)
    case reply(String, to: Message)
}

let chat = Message.reply("Да, в 7", to: .reply("Во сколько?", to: .text("Идём в кино")))
```

Без слова `indirect` Swift откажется это собирать. Ему нужно заранее знать, сколько памяти занимает значение. А `Message`, внутри которого лежит `Message`, внутри которого снова `Message`, оказался бы бесконечным. `indirect` говорит: «вложенное значение храни отдельно, а здесь держи только ссылку на него». Можно пометить и один случай: `indirect case reply(...)`.

Такие значения обрабатывают **рекурсивно**: функция вызывает саму себя для вложенной части.

```swift
func depth(_ message: Message) -> Int {
    switch message {
    case .text:
        return 1
    case .reply(_, let original):
        return 1 + depth(original)
    }
}
depth(chat)   // 3
```

**Продвинутые образцы.** В `case` можно писать не только имя случая, но и целый образец — «как должно выглядеть значение»:

- `let` внутри скобок забирает связанное значение в константу. Если забираешь всё, `let` можно вынести вперёд: `case let .reply(text, original)`;
- `_` значит «здесь что угодно, мне не важно»;
- образцы можно **вкладывать**: `case .reply(_, to: .text(let first))` совпадёт только с ответом, который отвечает прямо на обычное сообщение, и заберёт его текст;
- `where` добавляет условие: `case .text(let body) where body.isEmpty`;
- можно сопоставлять сразу несколько значений, собрав их в кортеж: `switch (isMuted, message) { case (true, _): ... }`.

**Порядок важен.** Swift проверяет `case` сверху вниз и выполняет первый подходящий. Поэтому частные случаи ставят выше общих:

```swift
switch message {
case .reply(_, to: .text(let first)):
    print("Ответ на сообщение: \(first)")
case .reply:
    print("Ответ на ответ")
case .text(let body):
    print(body)
}
```

Если поменять первые два `case` местами, частный случай никогда не сработает: общий `.reply` перехватит все ответы раньше.

### Задача
В редакторе есть структура `Note` и перечисление `Rule`:

- `tag(String)` — у заметки есть этот тег;
- `pinned` — заметка закреплена;
- `not(Rule)` — заметка НЕ подходит под вложенное правило;
- `both(Rule, Rule)` — подходит под оба правила;
- `either(Rule, Rule)` — подходит хотя бы под одно из двух.

1. Сделай `Rule` рекурсивным перечислением, чтобы код собрался.
2. Напиши метод `matches(_ note: Note) -> Bool`: подходит ли заметка под правило. Для вложенных правил вызывай `matches` у них.
3. Напиши вычисляемое свойство `summary: String` — описание правила:
   - `.tag(name)` — `"тег name"`, например `"тег работа"`;
   - `.pinned` — `"закреплённые"`;
   - `.not(.pinned)` — `"незакреплённые"`;
   - `.not(.tag(name))` — `"без тега name"`;
   - любое другое `.not(rule)` — `"не (описание rule)"`;
   - `.both(a, b)` — `"описание a и описание b"`;
   - `.either(a, b)` — `"описание a или описание b"`.

### Пример
```swift
let rule = Rule.both(.tag("работа"), .not(.tag("архив")))
rule.summary
// "тег работа и без тега архив"

Rule.not(.either(.pinned, .tag("срочно"))).summary
// "не (закреплённые или тег срочно)"

rule.matches(Note(title: "Отчёт", tags: ["работа"], isPinned: false))   // true
```

## @starter
```swift
// Заметка
struct Note {
    let title: String
    let tags: [String]
    let isPinned: Bool
}

// Правило умной папки. Правила вкладываются друг в друга
// 1. Сделай перечисление рекурсивным
enum Rule {
    case tag(String)
    case pinned
    case not(Rule)
    case both(Rule, Rule)
    case either(Rule, Rule)
}

extension Rule {
    // 2. Подходит ли заметка под правило
    func matches(_ note: Note) -> Bool {

    }

    // 3. Описание правила для заголовка папки
    var summary: String {

    }
}

// Умная папка. Этот код уже готов — менять его не нужно
let notes = [
    Note(title: "Отчёт за квартал", tags: ["работа"], isPinned: true),
    Note(title: "Старый договор", tags: ["работа", "архив"], isPinned: false),
    Note(title: "Созвон с дизайнером", tags: ["работа", "срочно"], isPinned: false),
    Note(title: "Рецепт пирога", tags: ["дом"], isPinned: false),
]
let workFolder = Rule.both(.tag("работа"), .not(.tag("архив")))

print("Папка: \(workFolder.summary)")
for note in notes {
    if workFolder.matches(note) {
        print("- \(note.title)")
    }
}
```

## @solution
```swift
// Заметка
struct Note {
    let title: String
    let tags: [String]
    let isPinned: Bool
}

// Правило умной папки. Правила вкладываются друг в друга
// 1. Сделай перечисление рекурсивным
indirect enum Rule {
    case tag(String)
    case pinned
    case not(Rule)
    case both(Rule, Rule)
    case either(Rule, Rule)
}

extension Rule {
    // 2. Подходит ли заметка под правило
    func matches(_ note: Note) -> Bool {
        switch self {
        case .tag(let name):
            return note.tags.contains(name)
        case .pinned:
            return note.isPinned
        case .not(let rule):
            return !rule.matches(note)
        case let .both(first, second):
            return first.matches(note) && second.matches(note)
        case let .either(first, second):
            return first.matches(note) || second.matches(note)
        }
    }

    // 3. Описание правила для заголовка папки
    var summary: String {
        switch self {
        case .tag(let name):
            return "тег \(name)"
        case .pinned:
            return "закреплённые"
        case .not(.pinned):
            return "незакреплённые"
        case .not(.tag(let name)):
            return "без тега \(name)"
        case .not(let rule):
            return "не (\(rule.summary))"
        case let .both(first, second):
            return "\(first.summary) и \(second.summary)"
        case let .either(first, second):
            return "\(first.summary) или \(second.summary)"
        }
    }
}

// Умная папка. Этот код уже готов — менять его не нужно
let notes = [
    Note(title: "Отчёт за квартал", tags: ["работа"], isPinned: true),
    Note(title: "Старый договор", tags: ["работа", "архив"], isPinned: false),
    Note(title: "Созвон с дизайнером", tags: ["работа", "срочно"], isPinned: false),
    Note(title: "Рецепт пирога", tags: ["дом"], isPinned: false),
]
let workFolder = Rule.both(.tag("работа"), .not(.tag("архив")))

print("Папка: \(workFolder.summary)")
for note in notes {
    if workFolder.matches(note) {
        print("- \(note.title)")
    }
}
```

## @output
```
Папка: тег работа и без тега архив
- Отчёт за квартал
- Созвон с дизайнером
```

## @tests
```swift
let __t_trip = Note(title: "Билеты", tags: ["отпуск", "срочно"], isPinned: true)
let __t_shop = Note(title: "Покупки", tags: ["дом"], isPinned: false)
let __t_old = Note(title: "Старый план", tags: ["отпуск", "архив"], isPinned: false)
let __t_empty = Note(title: "Пустая", tags: [], isPinned: false)

__eq("Тег есть", Rule.tag("дом").matches(__t_shop), true)
__eq("Тега нет", Rule.tag("дом").matches(__t_trip), false, hint: "Для .tag проверь, есть ли имя тега в массиве note.tags")
__eq("Заметка без тегов не подходит под тег", Rule.tag("дом").matches(__t_empty), false)
__eq("Закреплённая заметка", Rule.pinned.matches(__t_trip), true)
__eq("Незакреплённая заметка", Rule.pinned.matches(__t_shop), false)
__eq("not переворачивает ответ", Rule.not(.pinned).matches(__t_shop), true, hint: "Для .not вызови matches у вложенного правила и переверни результат через !")
__eq("not для подходящей заметки", Rule.not(.tag("отпуск")).matches(__t_trip), false)
__eq("both: оба правила выполнены", Rule.both(.tag("отпуск"), .pinned).matches(__t_trip), true)
__eq("both: выполнено только одно", Rule.both(.tag("отпуск"), .pinned).matches(__t_old), false, hint: "Для .both заметка должна подходить под оба правила: &&")
__eq("either: выполнено одно из двух", Rule.either(.tag("дом"), .pinned).matches(__t_shop), true, hint: "Для .either хватит одного правила: ||")
__eq("either: не выполнено ни одно", Rule.either(.tag("дом"), .pinned).matches(__t_old), false)
__eq("Двойное отрицание", Rule.not(.not(.tag("дом"))).matches(__t_shop), true)

let __t_deep = Rule.both(.tag("отпуск"), .not(.either(.tag("архив"), .tag("дом"))))
__eq("Глубокое правило: отпуск без архива и дома — Билеты подходят", __t_deep.matches(__t_trip), true, hint: "Для вложенных правил вызывай matches у них: проверка спускается по всем уровням")
__eq("Глубокое правило: Старый план в архиве — не подходит", __t_deep.matches(__t_old), false)
__eq("Глубокое правило: Покупки без отпуска — не подходят", __t_deep.matches(__t_shop), false)

__eq("Описание тега", Rule.tag("книги").summary, "тег книги")
__eq("Описание закреплённых", Rule.pinned.summary, "закреплённые")
__eq("Описание: not pinned — незакреплённые", Rule.not(.pinned).summary, "незакреплённые", hint: "Частный случай .not(.pinned) должен стоять выше общего .not(let rule)")
__eq("Описание: not tag — без тега", Rule.not(.tag("архив")).summary, "без тега архив", hint: "Вложенный образец .not(.tag(let name)) должен стоять выше общего .not(let rule)")
__eq("Описание: not для сложного правила — в скобках", Rule.not(.either(.pinned, .tag("срочно"))).summary, "не (закреплённые или тег срочно)", hint: "Общий случай .not: не, пробел и описание вложенного правила в круглых скобках")
__eq("Описание: not not", Rule.not(.not(.pinned)).summary, "не (незакреплённые)")
__eq("Описание: both", Rule.both(.tag("работа"), .not(.tag("архив"))).summary, "тег работа и без тега архив")
__eq("Описание: either", Rule.either(.pinned, .tag("срочно")).summary, "закреплённые или тег срочно")
__eq("Описание: вложенные both и either", Rule.both(.not(.pinned), .either(.tag("дом"), .tag("дача"))).summary, "незакреплённые и тег дом или тег дача", hint: "Для both и either описание каждой части получается из её собственного summary")
```

## @rules
- must: /\bindirect\b/ :: Перечисление, которое хранит само себя, нужно пометить словом `indirect`.
- must: /\.not\s*\(\s*\.tag\s*\(\s*let\s+\w+\s*\)\s*\)/ :: Для описания «без тега» используй вложенный образец: `case .not(.tag(let name))`.

## @hint1
Первый шаг — одно слово перед `enum`. Компилятор сам подскажет, какое: в сообщении об ошибке он просит пометить перечисление как рекурсивное.

`matches` — это `switch self` с пятью случаями. Для тега спроси у массива тегов заметки, есть ли в нём это имя. Для закреплённой — верни признак закрепления. В трёх остальных случаях внутри лежат другие правила: забери их через `let` и спроси у каждого его собственный `matches` для той же заметки. Для «не» переверни ответ, для «и» соедини ответы через «и», для «или» — через «или».

`summary` — тоже `switch self`, но случаев в нём семь: к пяти обычным добавляются два частных для «не». Первый совпадает, только если внутри «не» лежит `.pinned`. Второй — если внутри «не» лежит тег, и его имя нужно забрать. Эти два частных случая должны стоять выше общего «не» — иначе общий перехватит всё.

## @hint2
Рекурсивный вызов для вложенного правила:

```swift
case .not(let rule):
    return !rule.matches(note)
```

Вложенный образец и порядок в `summary`:

```swift
case .not(.pinned):
    return "незакреплённые"
case .not(.tag(let name)):
    return "без тега \(name)"
case .not(let rule):
    return "не (\(rule.summary))"
```

## @hint3
`matches` готов целиком, в `summary` три пропуска:

```swift
func matches(_ note: Note) -> Bool {
    switch self {
    case .tag(let name):
        return note.tags.contains(name)
    case .pinned:
        return note.isPinned
    case .not(let rule):
        return !rule.matches(note)
    case let .both(first, second):
        return first.matches(note) && second.matches(note)
    case let .either(first, second):
        return first.matches(note) || second.matches(note)
    }
}

var summary: String {
    switch self {
    case .tag(let name):
        return "тег \(name)"
    case .pinned:
        return "закреплённые"
    case .not(.pinned):
        return "незакреплённые"
    case .not(___):
        return "без тега \(name)"
    case .not(let rule):
        return "не (\(rule.summary))"
    case let .both(first, second):
        return "\(first.summary) и \(___)"
    case let .either(first, second):
        return ___
    }
}
```

В первом пропуске — вложенный образец, который забирает имя тега. Во втором — описание второго правила. В третьем — вся строка для «или».

## @hint4
Вот готовое решение:

{{solution}}

**Зачем `indirect`.** Случаи `not`, `both` и `either` хранят внутри значения `Rule`. Без `indirect` Swift пытался бы положить одно правило прямо внутрь другого и не смог бы посчитать, сколько памяти это займёт. С `indirect` вложенные правила хранятся отдельно, а внешнее держит на них ссылки. Глубина вложенности теперь может быть любой.

**Как работает рекурсия в `matches`.** Простые правила (`tag`, `pinned`) отвечают сразу. Составные не знают ответа сами — они спрашивают вложенные правила и комбинируют их ответы. Для правила «отпуск и не (архив или дом)» вызовы спускаются до самых простых правил, а ответы поднимаются обратно и соединяются через `!`, `&&` и `||`.

**Образцы в `summary`.** `case .not(.pinned)` — вложенный образец: он совпадает только с «не», внутри которого лежит именно `.pinned`. `case .not(.tag(let name))` идёт ещё глубже: проверяет, что внутри тег, и забирает его имя. `case .not(let rule)` — общий: забирает любое вложенное правило. Swift идёт сверху вниз, поэтому частные случаи стоят выше общего. Поставь общий первым — и описание «без тега архив» превратится в «не (тег архив)».

**Почему `case let .both(first, second)`.** Когда забираешь все связанные значения, `let` удобно вынести вперёд — это то же самое, что `.both(let first, let second)`.

**Типичные ошибки:**

- общий `case .not(let rule)` выше частных — они никогда не сработают;
- в `matches` для `.not` написать `!self.matches(note)` — функция будет вызывать саму себя для того же правила бесконечно, и программа упадёт;
- в `summary` для `both` склеить сами правила, а не их описания: нужно `first.summary`, а не `first`.
