---
title: Сортировка по любому полю
concept: Key paths — ссылки на свойства, KeyPath и WritableKeyPath
---

## @description

### Контекст
В меню списка заметок есть пункт «Сортировать»: по названию, по дате изменения, по длине. Сейчас в коде три почти одинаковые функции: `sortByTitle`, `sortByDate`, `sortByLength`. Дизайнер уже просит четвёртый вариант — по папке.

Тимлид: «Хватит копировать. Пусть будет одна функция, которой передают, *по какому полю* сортировать. Это делается через key path. И заодно сделай так же массовое изменение: кнопки "Открепить все" и "Перенести все в архив" тоже должны работать с любым полем».

### Новое в Swift
Обычно ты обращаешься к свойству сразу: `book.pages`. Но иногда нужно сказать, *какое* свойство взять, а взять его позже — в другой функции и у другого значения. Для этого есть **key path** — «путь к свойству». Записывается он обратной чертой, именем типа и свойства:

```swift
struct Book {
    var title: String
    var pages: Int
    var isRead: Bool
}

let pagesPath = \Book.pages          // не число, а адрес свойства pages
```

Чтобы по такому адресу прочитать значение, используют квадратные скобки с меткой `keyPath`:

```swift
let book = Book(title: "Белая гвардия", pages: 420, isRead: false)
print(book[keyPath: pagesPath])      // 420
```

**Тип ключевого пути.** У `\Book.pages` тип `KeyPath<Book, Int>`: в угловых скобках сначала тип, *у которого* берём свойство, потом тип *самого* свойства. Так функция может принимать путь как обычный параметр, а вместе с дженериком — путь к свойству любого типа:

```swift
func longest<Value: Comparable>(_ books: [Book], by path: KeyPath<Book, Value>) -> Book? {
    return books.max(by: { $0[keyPath: path] < $1[keyPath: path] })
}

// shelf — массив книг на полке
longest(shelf, by: \.pages)      // самая толстая книга
longest(shelf, by: \.title)      // последняя по алфавиту
```

Когда тип и так понятен из параметра, его можно не писать: `\.pages` вместо `\Book.pages`.

**Путь вместо замыкания.** Там, где ждут замыкание «элемент → значение», можно передать путь. Это часто встречается с `map` и `filter`:

```swift
let titles = shelf.map(\.title)       // то же, что shelf.map { $0.title }
let finished = shelf.filter(\.isRead)
```

**Запись по пути.** Если свойство объявлено через `var`, путь к нему можно использовать и для записи. Тогда его тип — `WritableKeyPath<Book, Bool>`:

```swift
var book = Book(title: "Дюна", pages: 700, isRead: false)
let readPath: WritableKeyPath<Book, Bool> = \.isRead
book[keyPath: readPath] = true
```

> 💡 Путь к свойству `let` бывает только `KeyPath` — записывать по нему нельзя. И сам экземпляр должен быть `var`, как при обычном присваивании.

### Задача
В редакторе есть структура `Note`.

1. Напиши функцию `sortedNotes(_:by:descending:)`. Она обобщённая: параметр типа `Value: Comparable`. Параметры:
   - `notes` типа `[Note]`, без метки;
   - `by keyPath` типа `KeyPath<Note, Value>`;
   - `descending` типа `Bool` со значением по умолчанию `false`.

   Возвращает `[Note]`: заметки, отсортированные по значению этого свойства. По возрастанию, а если `descending` равно `true` — по убыванию.
2. Напиши функцию `updateAll(_:set:to:)`. Она обобщённая: параметр типа `Value`. Параметры:
   - `notes` типа `inout [Note]`, без метки;
   - `set keyPath` типа `WritableKeyPath<Note, Value>`;
   - `to value` типа `Value`.

   Она записывает `value` в это свойство у каждой заметки массива и ничего не возвращает.

### Пример
```swift
sortedNotes(notes, by: \.title)                        // по алфавиту
sortedNotes(notes, by: \.editedAt, descending: true)   // сначала новые
updateAll(&notes, set: \.isPinned, to: false)          // открепить все
updateAll(&notes, set: \.folder, to: "Архив")          // всё в архив
```

## @starter
```swift
// Заметка. editedAt — время изменения в секундах с 1970 года: чем больше, тем новее
struct Note {
    var title: String
    var editedAt: Int
    var wordCount: Int
    var isPinned: Bool
    var folder: String
}

// 1. Сортировка по любому полю


// 2. Одно значение во всех заметках


// Экран списка. Этот код уже готов — менять его не нужно
var notes = [
    Note(title: "Рецепт сырников", editedAt: 1730462400, wordCount: 120, isPinned: true, folder: "Дом"),
    Note(title: "Книги на лето", editedAt: 1730203200, wordCount: 45, isPinned: false, folder: "Личное"),
    Note(title: "Планёрка", editedAt: 1730376000, wordCount: 310, isPinned: true, folder: "Работа"),
]

print("По названию:")
for note in sortedNotes(notes, by: \.title) {
    print("- \(note.title)")
}
print("Сначала новые:")
for note in sortedNotes(notes, by: \.editedAt, descending: true) {
    print("- \(note.title)")
}

updateAll(&notes, set: \.isPinned, to: false)
print("Закреплённых: \(notes.filter(\.isPinned).count)")
```

## @solution
```swift
// Заметка. editedAt — время изменения в секундах с 1970 года: чем больше, тем новее
struct Note {
    var title: String
    var editedAt: Int
    var wordCount: Int
    var isPinned: Bool
    var folder: String
}

// 1. Сортировка по любому полю
func sortedNotes<Value: Comparable>(_ notes: [Note], by keyPath: KeyPath<Note, Value>, descending: Bool = false) -> [Note] {
    return notes.sorted { first, second in
        if descending {
            return first[keyPath: keyPath] > second[keyPath: keyPath]
        }
        return first[keyPath: keyPath] < second[keyPath: keyPath]
    }
}

// 2. Одно значение во всех заметках
func updateAll<Value>(_ notes: inout [Note], set keyPath: WritableKeyPath<Note, Value>, to value: Value) {
    for index in notes.indices {
        notes[index][keyPath: keyPath] = value
    }
}

// Экран списка. Этот код уже готов — менять его не нужно
var notes = [
    Note(title: "Рецепт сырников", editedAt: 1730462400, wordCount: 120, isPinned: true, folder: "Дом"),
    Note(title: "Книги на лето", editedAt: 1730203200, wordCount: 45, isPinned: false, folder: "Личное"),
    Note(title: "Планёрка", editedAt: 1730376000, wordCount: 310, isPinned: true, folder: "Работа"),
]

print("По названию:")
for note in sortedNotes(notes, by: \.title) {
    print("- \(note.title)")
}
print("Сначала новые:")
for note in sortedNotes(notes, by: \.editedAt, descending: true) {
    print("- \(note.title)")
}

updateAll(&notes, set: \.isPinned, to: false)
print("Закреплённых: \(notes.filter(\.isPinned).count)")
```

## @output
```
По названию:
- Книги на лето
- Планёрка
- Рецепт сырников
Сначала новые:
- Рецепт сырников
- Планёрка
- Книги на лето
Закреплённых: 0
```

## @tests
```swift
let __t_notes = [
    Note(title: "Отпуск", editedAt: 1700000300, wordCount: 80, isPinned: false, folder: "Личное"),
    Note(title: "Бюджет", editedAt: 1700000100, wordCount: 410, isPinned: true, folder: "Дом"),
    Note(title: "Созвон", editedAt: 1700000900, wordCount: 25, isPinned: false, folder: "Работа"),
    Note(title: "Аптека", editedAt: 1700000500, wordCount: 12, isPinned: true, folder: "Дом"),
]

__eq("По названию, по возрастанию", sortedNotes(__t_notes, by: \.title).map(\.title), ["Аптека", "Бюджет", "Отпуск", "Созвон"], hint: "Сравнивай значения по пути: first[keyPath: keyPath] < second[keyPath: keyPath]")
__eq("По названию, по убыванию", sortedNotes(__t_notes, by: \.title, descending: true).map(\.title), ["Созвон", "Отпуск", "Бюджет", "Аптека"], hint: "Если descending равно true, сравнивай через >")
__eq("По времени изменения, по возрастанию", sortedNotes(__t_notes, by: \.editedAt).map(\.title), ["Бюджет", "Отпуск", "Аптека", "Созвон"], hint: "Функция должна сортировать по тому свойству, путь к которому передан, а не всегда по названию")
__eq("Сначала новые: по времени изменения, по убыванию", sortedNotes(__t_notes, by: \.editedAt, descending: true).map(\.title), ["Созвон", "Аптека", "Отпуск", "Бюджет"])
__eq("По числу слов, по убыванию", sortedNotes(__t_notes, by: \.wordCount, descending: true).map(\.wordCount), [410, 80, 25, 12])
__eq("По папке: одинаковые папки стоят рядом", sortedNotes(__t_notes, by: \.folder).map(\.folder), ["Дом", "Дом", "Личное", "Работа"])
__eq("По умолчанию сортировка по возрастанию", sortedNotes(__t_notes, by: \.wordCount).map(\.wordCount), [12, 25, 80, 410], hint: "У параметра descending значение по умолчанию — false")
__eq("Пустой список остаётся пустым", sortedNotes([], by: \.title).count, 0)
__eq("Сортировка не теряет и не повторяет заметки", sortedNotes(__t_notes, by: \.title).count, 4)

extension Note {
    var __t_negativeWords: Int { -wordCount }
}
__eq("Работает и с вычисляемым свойством", sortedNotes(__t_notes, by: \.__t_negativeWords).map(\.wordCount), [410, 80, 25, 12], hint: "Функция должна работать с любым путём, который ей передали")

var __t_batch = __t_notes
updateAll(&__t_batch, set: \.folder, to: "Архив")
__eq("Все заметки перенесены в архив", __t_batch.map(\.folder), ["Архив", "Архив", "Архив", "Архив"], hint: "Пройди по всем номерам массива и запиши значение: notes[index][keyPath: keyPath] = value")
__eq("Остальные поля не изменились", __t_batch.map(\.title), ["Отпуск", "Бюджет", "Созвон", "Аптека"])
__eq("Порядок заметок не изменился", __t_batch.map(\.editedAt), [1700000300, 1700000100, 1700000900, 1700000500])

updateAll(&__t_batch, set: \.isPinned, to: false)
__eq("Открепить все", __t_batch.filter(\.isPinned).count, 0, hint: "updateAll должна менять то свойство, путь к которому передан")
updateAll(&__t_batch, set: \.wordCount, to: 0)
__eq("Записать число во все заметки", __t_batch.map(\.wordCount), [0, 0, 0, 0])
__eq("Перенос в архив не тронул закрепление", __t_notes.filter(\.isPinned).count, 2)

var __t_empty: [Note] = []
updateAll(&__t_empty, set: \.title, to: "Без названия")
__eq("Пустой массив: ничего не происходит, ничего не падает", __t_empty.count, 0)
```

## @rules
- must: /\[\s*keyPath\s*:/ :: Читай и записывай значения по пути через `заметка[keyPath: путь]`.
- must: /WritableKeyPath\s*<\s*Note\s*,/ :: Для записи нужен путь типа `WritableKeyPath<Note, Value>`.

## @hint1
Обе функции — обобщённые: после имени в угловых скобках объявляется `Value`. Для сортировки у него есть ограничение `Comparable`, ведь значения нужно сравнивать. Для записи ограничение не нужно.

В `sortedNotes` используй знакомый `sorted` с замыканием из двух параметров — двух заметок. Внутри замыкания достань у каждой из них значение по пути (квадратные скобки с меткой `keyPath`) и сравни. Если `descending` истинно — сравнивай «больше», иначе «меньше».

В `updateAll` массив приходит как `inout`, его можно менять. Пройди циклом по всем номерам массива (`indices`) и у заметки с каждым номером запиши значение по пути. Обычный `for note in notes` здесь не подойдёт: `note` в таком цикле — копия, менять её бесполезно.

## @hint2
Чтение значения по пути внутри замыкания сортировки:

```swift
notes.sorted { first, second in
    return first[keyPath: keyPath] < second[keyPath: keyPath]
}
```

Объявление второй функции:

```swift
func updateAll<Value>(_ notes: inout [Note], set keyPath: WritableKeyPath<Note, Value>, to value: Value) {
    // цикл по notes.indices
}
```

## @hint3
Осталось три пропуска:

```swift
func sortedNotes<Value: Comparable>(_ notes: [Note], by keyPath: KeyPath<Note, Value>, descending: Bool = false) -> [Note] {
    return notes.sorted { first, second in
        if descending {
            return first[keyPath: keyPath] ___ second[keyPath: keyPath]
        }
        return first[keyPath: keyPath] < second[keyPath: keyPath]
    }
}

func updateAll<Value>(_ notes: inout [Note], set keyPath: WritableKeyPath<Note, Value>, to value: Value) {
    for index in notes.___ {
        notes[index][keyPath: ___] = value
    }
}
```

В первом пропуске — знак сравнения для сортировки по убыванию. Во втором — свойство массива с диапазоном всех номеров. В третьем — путь, по которому записывается значение.

## @hint4
Вот готовое решение:

{{solution}}

**Как работает `sortedNotes`.** Функция не знает, какое поле выбрал пользователь, и ей это не нужно. Она получает путь `keyPath` и в замыкании сортировки берёт по нему значение у двух заметок: `first[keyPath: keyPath]`. Если передали `\.title`, сравниваются названия. Если `\.editedAt` — числа. Ограничение `Value: Comparable` гарантирует, что значения можно сравнить знаками `<` и `>`. Поэтому путь к `isPinned` сюда не передать: `Bool` не сравнивается на «больше-меньше», и Swift остановит такой код ещё до запуска.

**Почему в `updateAll` цикл по `indices`.** Массив структур хранит значения, а не ссылки. В цикле `for note in notes` переменная `note` — копия, и запись в неё не изменит массив. Поэтому цикл идёт по номерам, а запись — прямо в элемент массива: `notes[index][keyPath: keyPath] = value`. Массив передан как `inout`, и изменения видны тому, кто вызвал функцию.

**Почему `WritableKeyPath`, а не `KeyPath`.** По обычному `KeyPath` можно только читать. Swift не даст записать по нему значение, даже если свойство объявлено через `var`. Тип параметра заранее обещает: «сюда передают только пути, по которым можно писать».

**Что получилось.** Четыре варианта сортировки в меню — это четыре вызова одной функции с разными путями. А пятый, который придумает дизайнер, не потребует нового кода.

**Типичные ошибки:**

- `KeyPath<Note, Value>` без ограничения `Value: Comparable` — тогда Swift не разрешит сравнивать значения знаком `<`;
- в `updateAll` цикл `for var note in notes` — заметки в массиве не изменятся;
- в `descending` написать `>=` — для одинаковых значений сортировка будет вести себя непредсказуемо.
