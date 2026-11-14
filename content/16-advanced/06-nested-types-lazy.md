---
title: Стиль заметки
concept: Вложенные типы, typealias и lazy-свойства
---

## @description

### Контекст
В редакторе «Чернил» появляется панель стилей: «Обычный», «Заголовок», «Подпись». У каждого стиля свой размер шрифта. А ещё в редакторе есть проверка орфографии. Её словарь огромный и загружается почти секунду.

Тимлид принёс два замечания с код-ревью. Первое: «Тип `Style` у нас уже есть — для кнопок. Стиль текста положи внутрь редактора, пусть это будет `NoteEditor.Style`. И размер шрифта обозначь понятным именем `Points`, а не голым `Int`». Второе: «Профайлер показывает, что каждая заметка открывается на секунду дольше: словарь грузится сразу. А проверкой орфографии пользуется от силы каждый десятый. Пусть словарь создаётся только тогда, когда он действительно понадобился».

### Новое в Swift
**Вложенные типы.** Тип можно объявить прямо внутри другого типа. Так делают, когда маленький тип имеет смысл только вместе с большим:

```swift
struct Reminder {
    enum Frequency {
        case once, daily, weekly
    }

    var title: String
    var frequency: Frequency     // внутри Reminder — просто Frequency
}

let plan = Reminder(title: "Полить цветы", frequency: .weekly)
let option = Reminder.Frequency.daily   // снаружи — полное имя
```

Внутри `Reminder` вложенный тип зовётся коротко: `Frequency`. Снаружи — через точку: `Reminder.Frequency`. Поэтому у разных типов могут быть вложенные типы с одинаковыми именами, и они не мешают друг другу: `Reminder.Frequency` и `Subscription.Frequency` — два разных типа.

**typealias** даёт существующему типу второе имя. Ты уже встречала его для типов замыканий. Он полезен и для простых типов, когда голое `Int` ничего не говорит о смысле числа:

```swift
struct Reminder {
    typealias Minutes = Int
    var snooze: Minutes = 10      // сразу ясно: это минуты
}
```

Новый тип при этом не появляется: `Minutes` — это тот же `Int`, их можно складывать и сравнивать. Псевдоним тоже может быть вложенным, тогда снаружи он называется `Reminder.Minutes`.

**lazy — ленивое свойство.** Обычное хранимое свойство получает значение сразу, когда создаётся экземпляр. А `lazy`-свойство откладывает это до первого обращения. Если к нему так и не обратились, значение не создаётся вовсе:

```swift
final class PhotoViewer {
    var photo: String
    lazy var filters = FilterLibrary()   // тяжёлая библиотека фильтров

    init(photo: String) {
        self.photo = photo
    }
}

let viewer = PhotoViewer(photo: "море.jpg")   // FilterLibrary ещё не создана
viewer.filters.apply("сепия")                 // создаётся здесь, один раз
viewer.filters.apply("ч/б")                   // берётся уже готовая
```

Правила `lazy`: это всегда `var` (значение появляется позже, чем экземпляр), и вычисляется оно только один раз. В структуре первое обращение к `lazy`-свойству меняет её, поэтому экземпляр структуры должен быть `var`. С классами такого ограничения нет.

> 💡 `lazy` хорош для дорогих вещей, которые нужны не всегда: словари, кэши, форматтеры, загрузчики. Для дешёвых значений вроде `0` или `""` он не нужен.

### Задача
В редакторе есть готовый класс `SpellChecker` (словарь орфографии) и заготовка класса `NoteEditor`. Внутри `NoteEditor`:

1. Объяви псевдоним `typealias Points = Int`.
2. Объяви вложенное перечисление `Style`, соответствующее `CaseIterable`, со случаями `body`, `heading`, `caption` (именно в этом порядке). У него два вычисляемых свойства:
   - `title` типа `String`: `"Обычный"`, `"Заголовок"`, `"Подпись"`;
   - `fontSize` типа `Points`: `16`, `24`, `13`.
3. Объяви ленивое свойство `spellChecker`, которое создаёт `SpellChecker()`. Словарь должен создаваться при первом обращении и только один раз на редактор.

Готовые части класса и код внизу не меняй.

### Пример
```swift
NoteEditor.Style.heading.fontSize      // 24
NoteEditor.Style.allCases.count        // 3

let editor = NoteEditor(text: "купить молоко")
SpellChecker.loadCount                 // 0 — словарь ещё не нужен
editor.isSpelledCorrectly("молоко")    // true, словарь загрузился
editor.isSpelledCorrectly("малако")    // false
SpellChecker.loadCount                 // 1
```

## @starter
```swift
// Готово: проверка орфографии. Словарь большой и загружается долго
final class SpellChecker {
    // Сколько раз загружали словарь — это видно в отчёте о скорости
    static var loadCount = 0
    private let knownWords: Set<String>

    init() {
        SpellChecker.loadCount += 1
        knownWords = ["купить", "молоко", "хлеб", "яблоки", "позвонить", "завтра"]
    }

    func isKnown(_ word: String) -> Bool {
        return knownWords.contains(word.lowercased())
    }
}

// Редактор заметки
final class NoteEditor {
    // 1. Псевдоним Points для размера шрифта


    // 2. Вложенное перечисление Style


    var text: String
    var textStyle: Style = .body

    // 3. Проверка орфографии: создаётся при первом обращении


    init(text: String) {
        self.text = text
    }

    // Готово: размер шрифта текущего стиля
    var fontSize: Points {
        textStyle.fontSize
    }

    // Готово: проверить слово
    func isSpelledCorrectly(_ word: String) -> Bool {
        return spellChecker.isKnown(word)
    }
}

// Панель стилей и проверка. Этот код уже готов — менять его не нужно
print("Стили:")
for option in NoteEditor.Style.allCases {
    print("\(option.title): \(option.fontSize) pt")
}

let editor = NoteEditor(text: "купить молоко")
editor.textStyle = .heading
print("Размер шрифта: \(editor.fontSize)")
print("Загрузок словаря: \(SpellChecker.loadCount)")
print("молоко: \(editor.isSpelledCorrectly("молоко"))")
print("малако: \(editor.isSpelledCorrectly("малако"))")
print("Загрузок словаря: \(SpellChecker.loadCount)")
```

## @solution
```swift
// Готово: проверка орфографии. Словарь большой и загружается долго
final class SpellChecker {
    // Сколько раз загружали словарь — это видно в отчёте о скорости
    static var loadCount = 0
    private let knownWords: Set<String>

    init() {
        SpellChecker.loadCount += 1
        knownWords = ["купить", "молоко", "хлеб", "яблоки", "позвонить", "завтра"]
    }

    func isKnown(_ word: String) -> Bool {
        return knownWords.contains(word.lowercased())
    }
}

// Редактор заметки
final class NoteEditor {
    // 1. Псевдоним Points для размера шрифта
    typealias Points = Int

    // 2. Вложенное перечисление Style
    enum Style: CaseIterable {
        case body, heading, caption

        var title: String {
            switch self {
            case .body: return "Обычный"
            case .heading: return "Заголовок"
            case .caption: return "Подпись"
            }
        }

        var fontSize: Points {
            switch self {
            case .body: return 16
            case .heading: return 24
            case .caption: return 13
            }
        }
    }

    var text: String
    var textStyle: Style = .body

    // 3. Проверка орфографии: создаётся при первом обращении
    lazy var spellChecker = SpellChecker()

    init(text: String) {
        self.text = text
    }

    // Готово: размер шрифта текущего стиля
    var fontSize: Points {
        textStyle.fontSize
    }

    // Готово: проверить слово
    func isSpelledCorrectly(_ word: String) -> Bool {
        return spellChecker.isKnown(word)
    }
}

// Панель стилей и проверка. Этот код уже готов — менять его не нужно
print("Стили:")
for option in NoteEditor.Style.allCases {
    print("\(option.title): \(option.fontSize) pt")
}

let editor = NoteEditor(text: "купить молоко")
editor.textStyle = .heading
print("Размер шрифта: \(editor.fontSize)")
print("Загрузок словаря: \(SpellChecker.loadCount)")
print("молоко: \(editor.isSpelledCorrectly("молоко"))")
print("малако: \(editor.isSpelledCorrectly("малако"))")
print("Загрузок словаря: \(SpellChecker.loadCount)")
```

## @output
```
Стили:
Обычный: 16 pt
Заголовок: 24 pt
Подпись: 13 pt
Размер шрифта: 24
Загрузок словаря: 0
молоко: true
малако: false
Загрузок словаря: 1
```

## @tests
```swift
let __t_points: NoteEditor.Points = 18
__eq("NoteEditor.Points — это другое имя для Int", __t_points + 1, 19, hint: "Объяви внутри NoteEditor строку typealias Points = Int")

__eq("Стили по порядку", NoteEditor.Style.allCases.map { $0.title }, ["Обычный", "Заголовок", "Подпись"], hint: "Случаи body, heading, caption — именно в этом порядке. Проверь и тексты title")
__eq("Размеры шрифтов по порядку", NoteEditor.Style.allCases.map { $0.fontSize }, [16, 24, 13])
let __t_caption: NoteEditor.Points = NoteEditor.Style.caption.fontSize
__eq("Подпись — 13 пунктов", __t_caption, 13)
__eq("Заголовок — 24 пункта", NoteEditor.Style.heading.fontSize, 24)

let __t_before = SpellChecker.loadCount
let __t_editor = NoteEditor(text: "позвонить завтра")
__eq("Создание редактора не загружает словарь", SpellChecker.loadCount, __t_before, hint: "Словарь создаётся в момент создания редактора. Пометь свойство spellChecker словом lazy")
__t_editor.textStyle = .caption
__eq("Смена стиля не загружает словарь", SpellChecker.loadCount, __t_before)
__eq("Размер шрифта редактора берётся из стиля", __t_editor.fontSize, 13)

__eq("Проверка известного слова", __t_editor.isSpelledCorrectly("Завтра"), true)
__eq("Первая проверка загружает словарь один раз", SpellChecker.loadCount, __t_before + 1)
__eq("Проверка слова с ошибкой", __t_editor.isSpelledCorrectly("зафтра"), false)
_ = __t_editor.isSpelledCorrectly("хлеб")
__eq("Повторные проверки не загружают словарь заново", SpellChecker.loadCount, __t_before + 1, hint: "Словарь создаётся при каждом обращении. Вычисляемое свойство здесь не подходит: нужно lazy var spellChecker = SpellChecker()")
__ok("У редактора всё время один и тот же словарь", __t_editor.spellChecker === __t_editor.spellChecker)

let __t_other = NoteEditor(text: "яблоки")
__eq("Второй редактор без проверки орфографии ничего не загружает", SpellChecker.loadCount, __t_before + 1)
_ = __t_other.isSpelledCorrectly("яблоки")
__eq("У второго редактора свой словарь", SpellChecker.loadCount, __t_before + 2)
```

## @rules
- must: /\blazy\s+var\s+spellChecker\b/ :: Объяви словарь ленивым: `lazy var spellChecker = SpellChecker()`.
- must: /\btypealias\s+Points\s*=\s*Int\b/ :: Объяви псевдоним: `typealias Points = Int`.
- must: /var\s+fontSize\s*:\s*Points\b/ :: Используй псевдоним: размер шрифта в `Style` должен иметь тип `Points`.

## @hint1
Все три объявления пишутся внутри класса `NoteEditor`, на местах с комментариями. Готовые части класса уже пользуются именами `Points`, `Style` и `spellChecker` — поэтому, пока ты их не объявишь, код не соберётся.

Псевдоним — одна строка: слово `typealias`, новое имя, знак равенства и тип, который за ним стоит.

Перечисление `Style` — такое же, какие ты писала в модуле про перечисления. Отличие только в месте: оно объявлено внутри класса. После имени через двоеточие укажи `CaseIterable` — панели стилей нужен список всех случаев. Внутри три случая и два вычисляемых свойства, каждое — `switch self`. Тип размера шрифта — `Points`: псевдоним объявлен в том же классе, поэтому его видно и во вложенном типе.

Словарь — одна строка: обычное хранимое свойство со значением `SpellChecker()`, но с пометкой, которая откладывает создание до первого обращения.

## @hint2
Вложенное перечисление пишется прямо внутри класса:

```swift
final class NoteEditor {
    typealias Points = Int

    enum Style: CaseIterable {
        case body, heading, caption

        var fontSize: Points {
            switch self {
            case .body: return 16
            // ещё два случая
            }
        }
    }
    // ...
}
```

Ленивое свойство отличается от обычного одним словом перед `var`.

## @hint3
Осталось заполнить пропуски:

```swift
typealias Points = Int

enum Style: CaseIterable {
    case body, heading, caption

    var title: String {
        switch self {
        case .body: return "Обычный"
        case .heading: return ___
        case .caption: return "Подпись"
        }
    }

    var fontSize: ___ {
        switch self {
        case .body: return 16
        case .heading: return 24
        case .caption: return 13
        }
    }
}

___ var spellChecker = SpellChecker()
```

В первом пропуске — название стиля для заголовка. Во втором — псевдоним типа для размера шрифта. В третьем — слово, которое откладывает создание словаря.

## @hint4
Вот готовое решение:

{{solution}}

**Вложенный тип.** `Style` объявлен внутри `NoteEditor`, поэтому его полное имя — `NoteEditor.Style`. Внутри класса хватает короткого `Style`: так он и записан в свойстве `textStyle`. Стиль кнопок `Style`, который уже есть в проекте, теперь не конфликтует со стилем текста — это два разных типа с разными полными именами.

**Псевдоним.** `Points` — это тот же `Int`, Swift не видит разницы. Но в строке `var fontSize: Points` сразу понятно, что число означает пункты шрифта, а не пиксели или проценты. Вложенное перечисление видит псевдоним, потому что оба объявлены внутри одного класса.

**Ленивое свойство.** Без `lazy` словарь создавался бы в момент `NoteEditor(text:)`, и каждая заметка открывалась бы на секунду дольше. С `lazy` первая строка вывода показывает `Загрузок словаря: 0`: редактор создан, стиль изменён, а словаря ещё нет. Он появляется при первом вызове `isSpelledCorrectly` и дальше переиспользуется — после двух проверок загрузка всё равно одна.

**Почему не вычисляемое свойство.** Запись `var spellChecker: SpellChecker { SpellChecker() }` тоже откладывает создание. Но вычисляемое свойство выполняется заново при *каждом* обращении, и словарь грузился бы на каждое слово. `lazy` вычисляет значение один раз и запоминает его.

**Типичные ошибки:**

- `lazy let` — так нельзя, ленивое свойство всегда `var`;
- объявить `Style` снаружи класса — тогда имя `NoteEditor.Style` не найдётся;
- забыть `CaseIterable` — у перечисления не будет `allCases`, и панель стилей не соберётся.
