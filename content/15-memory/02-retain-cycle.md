---
title: Утечка памяти
concept: Цикл сильных ссылок и его ручной разрыв
---

## @description

### Контекст
Тестировщик открыл альбом «Отпуск 2025», полистал его и закрыл. Потом сделал так ещё двадцать раз и приложил к тикету график: память растёт после каждого альбома и не уменьшается. «Похоже, закрытые альбомы остаются в памяти».

Тимлид уже нашёл виноватых: «Экран альбома держит альбом. Альбом держит открытый экран, чтобы сообщать ему о новых фото. А сетка с миниатюрами держит экран, чтобы сообщать о нажатиях. Получились циклы. В метод `close()` никто ничего не написал — допиши его так, чтобы при закрытии циклы разрывались».

### Новое в Swift
В прошлой задаче объект исчезал, когда пропадала последняя сильная ссылка на него. А что, если два объекта ссылаются **друг на друга**?

Возьмём историю из профиля и экран её просмотра:

```swift
class Story {
    let title: String
    var viewer: StoryViewer?      // экран, который сейчас показывает историю

    init(title: String) {
        self.title = title
    }
}

class StoryViewer {
    let story: Story

    init(story: Story) {
        self.story = story
        story.viewer = self       // история теперь держит экран
    }
}
```

Посчитаем ссылки:

```swift
var viewer: StoryViewer? = StoryViewer(story: Story(title: "Выходные"))
// StoryViewer: 2 - переменная viewer и свойство story.viewer
// Story: 1 - свойство viewer.story

viewer = nil
// StoryViewer: 1 - его всё ещё держит story.viewer
// Story: 1 - её всё ещё держит экран
// Ни один deinit не сработал
```

После `viewer = nil` у программы больше нет ни одной переменной, через которую можно добраться до этих объектов. Но каждый из них держит другой, поэтому счётчики никогда не станут нулём. Это **цикл сильных ссылок** (retain cycle). Объекты бесполезны, но занимают память до самого закрытия приложения. Такое и называют **утечкой памяти**.

Цикл может быть и длиннее: A держит B, B держит C, а C держит A. Правило одно: если, идя по сильным ссылкам, можно вернуться к тому же объекту, — это цикл.

**Как разорвать цикл вручную.** Пока до объектов ещё можно добраться, убери одну из ссылок цикла. Для этого она должна быть опциональной переменной:

```swift
var viewer: StoryViewer? = StoryViewer(story: Story(title: "Выходные"))
viewer?.story.viewer = nil    // StoryViewer: 1, цикла больше нет
viewer = nil                  // StoryViewer: 0 - deinit экрана
                              // экран отпускает story -> Story: 0 - deinit истории
```

Обычно это делают в методе, который вызывают при закрытии: `close()`, `stop()`, `cancel()`. В нём объект «отписывается» от всех, кто держит ссылку на него.

> ⚠️ Ручной разрыв работает, только если метод закрытия точно вызовут. Забыли — утечка вернулась. В следующей задаче ты узнаешь, как сделать так, чтобы цикл вообще не возникал.

### Задача
В редакторе три класса: `Album` (альбом), `AlbumScreen` (экран альбома) и `PhotoGrid` (сетка миниатюр на экране). Их `deinit` уже пишут в журнал `lifecycleLog`. Сценарий внизу открывает альбом, добавляет фото, нажимает на миниатюру и закрывает экран.

1. Нажми «Проверить», ничего не меняя. Сценарий работает, но строк об освобождении в журнале нет: все три объекта утекли.
2. Найди два цикла сильных ссылок. Подсказка: посмотри, какие свойства указывают на экран.
3. Допиши метод `close()` в `AlbumScreen`. Он делает три вещи:
   - добавляет в `lifecycleLog` строку `Экран закрыт: ` и название альбома;
   - разрывает цикл с альбомом;
   - разрывает цикл с сеткой.
4. Не убирай строки `album.openScreen = self` и `grid.screen = self` из `init`: пока экран открыт, он должен узнавать о новых фото и нажатиях. Это проверяется.

### Пример
Сценарий должен вывести:

```text
Отпуск 2025: 2 фото
Открыто фото: IMG_0102.jpg
Экран закрыт: Отпуск 2025
Экран освобождён: Отпуск 2025
Сетка миниатюр освобождена
Альбом освобождён: Отпуск 2025
```

После `close()` новые фото в альбоме и нажатия на сетку больше не доходят до закрытого экрана.

## @starter
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Альбом. Когда в него добавляют фото, он просит открытый экран обновиться
class Album {
    let title: String
    var photoNames: [String] = []
    var openScreen: AlbumScreen?

    init(title: String) {
        self.title = title
    }

    func addPhoto(named name: String) {
        photoNames.append(name)
        openScreen?.refresh()
    }

    deinit {
        lifecycleLog.append("Альбом освобождён: \(title)")
    }
}

// Сетка миниатюр. О нажатии на фото она сообщает экрану
class PhotoGrid {
    var photoNames: [String] = []
    var screen: AlbumScreen?

    func tapPhoto(at index: Int) {
        guard index >= 0 && index < photoNames.count else {
            return
        }
        screen?.openPhoto(named: photoNames[index])
    }

    deinit {
        lifecycleLog.append("Сетка миниатюр освобождена")
    }
}

// Экран альбома
class AlbumScreen {
    let album: Album
    let grid = PhotoGrid()
    var headerText = ""
    var openedPhoto = ""

    init(album: Album) {
        self.album = album
        album.openScreen = self
        grid.screen = self
        refresh()
    }

    func refresh() {
        headerText = "\(album.title): \(album.photoNames.count) фото"
        grid.photoNames = album.photoNames
    }

    func openPhoto(named name: String) {
        openedPhoto = name
    }

    // Пользователь закрывает экран
    func close() {
        // 3. Запиши в журнал "Экран закрыт: " и название альбома,
        //    а потом разорви оба цикла

    }

    deinit {
        lifecycleLog.append("Экран освобождён: \(album.title)")
    }
}

// Сценарий из тикета
var album: Album? = Album(title: "Отпуск 2025")
var screen: AlbumScreen?
if let currentAlbum = album {
    screen = AlbumScreen(album: currentAlbum)
}
album?.addPhoto(named: "IMG_0101.jpg")
album?.addPhoto(named: "IMG_0102.jpg")
screen?.grid.tapPhoto(at: 1)
print(screen?.headerText ?? "Экран не открыт")
print("Открыто фото: \(screen?.openedPhoto ?? "нет")")

// Пользователь закрывает альбом
screen?.close()
screen = nil
album = nil

for entry in lifecycleLog {
    print(entry)
}
```

## @solution
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// Альбом. Когда в него добавляют фото, он просит открытый экран обновиться
class Album {
    let title: String
    var photoNames: [String] = []
    var openScreen: AlbumScreen?

    init(title: String) {
        self.title = title
    }

    func addPhoto(named name: String) {
        photoNames.append(name)
        openScreen?.refresh()
    }

    deinit {
        lifecycleLog.append("Альбом освобождён: \(title)")
    }
}

// Сетка миниатюр. О нажатии на фото она сообщает экрану
class PhotoGrid {
    var photoNames: [String] = []
    var screen: AlbumScreen?

    func tapPhoto(at index: Int) {
        guard index >= 0 && index < photoNames.count else {
            return
        }
        screen?.openPhoto(named: photoNames[index])
    }

    deinit {
        lifecycleLog.append("Сетка миниатюр освобождена")
    }
}

// Экран альбома
class AlbumScreen {
    let album: Album
    let grid = PhotoGrid()
    var headerText = ""
    var openedPhoto = ""

    init(album: Album) {
        self.album = album
        album.openScreen = self
        grid.screen = self
        refresh()
    }

    func refresh() {
        headerText = "\(album.title): \(album.photoNames.count) фото"
        grid.photoNames = album.photoNames
    }

    func openPhoto(named name: String) {
        openedPhoto = name
    }

    // Пользователь закрывает экран
    func close() {
        // 3. Запиши в журнал "Экран закрыт: " и название альбома,
        //    а потом разорви оба цикла
        lifecycleLog.append("Экран закрыт: \(album.title)")
        album.openScreen = nil
        grid.screen = nil
    }

    deinit {
        lifecycleLog.append("Экран освобождён: \(album.title)")
    }
}

// Сценарий из тикета
var album: Album? = Album(title: "Отпуск 2025")
var screen: AlbumScreen?
if let currentAlbum = album {
    screen = AlbumScreen(album: currentAlbum)
}
album?.addPhoto(named: "IMG_0101.jpg")
album?.addPhoto(named: "IMG_0102.jpg")
screen?.grid.tapPhoto(at: 1)
print(screen?.headerText ?? "Экран не открыт")
print("Открыто фото: \(screen?.openedPhoto ?? "нет")")

// Пользователь закрывает альбом
screen?.close()
screen = nil
album = nil

for entry in lifecycleLog {
    print(entry)
}
```

## @output
```
Отпуск 2025: 2 фото
Открыто фото: IMG_0102.jpg
Экран закрыт: Отпуск 2025
Экран освобождён: Отпуск 2025
Сетка миниатюр освобождена
Альбом освобождён: Отпуск 2025
```

## @tests
```swift
// Пока экран открыт, связи работают
do {
    let __t_album = Album(title: "Котики")
    let __t_screen = AlbumScreen(album: __t_album)
    __t_album.addPhoto(named: "IMG_0201.jpg")
    __eq("Открытый экран узнаёт о новом фото в альбоме Котики", __t_screen.headerText, "Котики: 1 фото", hint: "Не убирай album.openScreen = self из init: через эту ссылку альбом обновляет экран")
    __t_screen.grid.tapPhoto(at: 0)
    __eq("Нажатие на миниатюру открывает фото", __t_screen.openedPhoto, "IMG_0201.jpg", hint: "Не убирай grid.screen = self из init: через эту ссылку сетка сообщает экрану о нажатиях")
    __t_screen.close()
}

// close() пишет в журнал и отвязывает экран от альбома и сетки
lifecycleLog = []
var __t_keptAlbum: Album? = Album(title: "Дача")
var __t_keptScreen: AlbumScreen? = nil
if let __t_a = __t_keptAlbum {
    __t_keptScreen = AlbumScreen(album: __t_a)
    __t_a.addPhoto(named: "IMG_0301.jpg")
}
__t_keptScreen?.close()
__eq("close() записывает в журнал: Экран закрыт: Дача", lifecycleLog, ["Экран закрыт: Дача"], hint: "Первой строкой close() добавь в lifecycleLog строку \"Экран закрыт: \" и название альбома: album.title")
__ok("После close() альбом больше не ссылается на экран", __t_keptAlbum?.openScreen == nil, hint: "В close() положи nil в свойство openScreen альбома: album.openScreen = nil")
__ok("После close() сетка больше не ссылается на экран", __t_keptScreen?.grid.screen == nil, hint: "В close() положи nil в свойство screen сетки: grid.screen = nil")
__t_keptAlbum?.addPhoto(named: "IMG_0302.jpg")
__eq("Новое фото после закрытия не обновляет закрытый экран", __t_keptScreen?.headerText ?? "", "Дача: 1 фото", hint: "Пока экран открыт, первое фото обновляет заголовок. После close() альбом не должен знать о закрытом экране: заголовок остаётся прежним")
__t_keptScreen?.grid.tapPhoto(at: 0)
__eq("Нажатие на сетку после закрытия не доходит до экрана", __t_keptScreen?.openedPhoto ?? "", "", hint: "После close() сетка не должна знать о закрытом экране")

// Закрытый экран освобождается, а альбом живёт, пока его держат
lifecycleLog = []
__t_keptScreen = nil
__ok("Закрытый экран освобождён", lifecycleLog.contains("Экран освобождён: Дача"), hint: "Экран всё ещё в памяти: его держит кто-то, кроме переменной. Проверь, что close() кладёт nil и в album.openScreen, и в grid.screen")
__ok("Сетка миниатюр освобождена вместе с экраном", lifecycleLog.contains("Сетка миниатюр освобождена"), hint: "Сетку держит только экран. Если экран не освободился, не освободится и она")
__ok("Альбом ещё жив: его держит другая переменная", !lifecycleLog.contains("Альбом освобождён: Дача"), hint: "Не отпускай альбом в close(): им ещё пользуются другие части приложения")
__t_keptAlbum = nil
__ok("Альбом освобождён, когда исчезла последняя ссылка", lifecycleLog.contains("Альбом освобождён: Дача"), hint: "Альбом держит закрытый экран. Проверь, что close() разрывает оба цикла")

// Полный цикл в отдельном блоке: открыть, закрыть, уйти
lifecycleLog = []
do {
    let __t_screen = AlbumScreen(album: Album(title: "Свадьба"))
    __t_screen.album.addPhoto(named: "IMG_0401.jpg")
    __t_screen.close()
}
__eq("После закрытия и выхода из блока в памяти не осталось ничего", lifecycleLog.sorted(), ["Альбом освобождён: Свадьба", "Сетка миниатюр освобождена", "Экран закрыт: Свадьба", "Экран освобождён: Свадьба"], hint: "Все три объекта должны освободиться. Если какой-то строки нет, этот объект утёк")
```

## @hint1
Сначала найди циклы. Начни с экрана и пройди по его свойствам. Экран держит альбом в свойстве `album`. А альбом держит экран в свойстве `openScreen` — вот и первый цикл: от экрана можно прийти к альбому и вернуться обратно. Экран держит сетку в свойстве `grid`, а сетка держит экран в свойстве `screen` — второй цикл.

Обе обратные ссылки — `openScreen` и `screen` — опциональные переменные. Значит, их можно обнулить. Как раз это и должен делать `close()`.

В методе три строки. Первая добавляет запись в журнал, как это делают `deinit`, только текст другой. Вторая обращается к альбому через свойство экрана и кладёт `nil` в его `openScreen`. Третья так же поступает со свойством `screen` у сетки.

Строки в `init`, которые создают эти связи, не трогай: пока экран открыт, они нужны.

## @hint2
Цикл разрывают, положив `nil` в одну из его ссылок — ту, что опциональная:

```swift
viewer?.story.viewer = nil
```

Внутри метода экрана к своим свойствам обращаются напрямую: `album.openScreen`, `grid.screen`. Запись в журнал выглядит как в `deinit`:

```swift
lifecycleLog.append("Экран закрыт: \(album.title)")
```

## @hint3
Метод почти готов, заполни пропуски:

```swift
func close() {
    lifecycleLog.append("Экран закрыт: \(album.title)")
    album.___ = nil
    ___ = nil
}
```

В первом пропуске — свойство альбома, в котором лежит открытый экран. Во втором — свойство сетки, которое указывает на экран, вместе с самой сеткой, через точку.

## @hint4
Вот готовое решение:

{{solution}}

**Где были циклы.** Экран держит альбом (`album`), а альбом держит экран (`openScreen`). Экран держит сетку (`grid`), а сетка держит экран (`screen`). В сценарии после `screen = nil` и `album = nil` переменных больше нет, но счётчики не падали до нуля: у экрана оставались две ссылки — от альбома и от сетки. Поэтому ни один `deinit` не срабатывал.

**Что делает `close()`.** Две последние строки убирают обе ссылки на экран, которые держат другие объекты. Теперь его держит только переменная `screen`. Посчитаем по шагам:

- `screen = nil` — у экрана 0 ссылок, срабатывает его `deinit`: «Экран освобождён»;
- экран отпускает свои свойства: у сетки 0 ссылок — «Сетка миниатюр освобождена»; у альбома остаётся одна ссылка, от переменной `album`;
- `album = nil` — у альбома 0 ссылок: «Альбом освобождён».

**Почему разрывают ссылки на экран, а не `album` и `grid` у экрана.** Эти свойства объявлены через `let`, их нельзя обнулить. Так и задумано: экран без альбома и сетки не имеет смысла. А вот обратные ссылки — служебные: они нужны только пока экран открыт. Поэтому они опциональные, и закрытие их обнуляет.

**Слабое место решения.** Если кто-то забудет вызвать `close()`, утечка вернётся. В следующей задаче ты научишься делать обратные ссылки такими, чтобы цикла не было вовсе.

**Типичные ошибки:**

- разорван только один цикл — второй продолжает держать экран, а экран держит альбом, и не освобождается никто;
- строки `album.openScreen = self` и `grid.screen = self` удалены из `init` — утечки нет, но экран перестал узнавать о новых фото и нажатиях;
- в `close()` написано `screen = nil` — это глобальная переменная сценария, а не свойство сетки. Нужно `grid.screen = nil`.
