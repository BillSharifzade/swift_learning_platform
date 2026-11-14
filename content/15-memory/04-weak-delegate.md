---
title: Делегат без утечки
concept: Слабый делегат — протокол AnyObject и weak var delegate
---

## @description

### Контекст
Экран галереи показывает миниатюры альбома. Загружает их `ImageLoader`: когда файл пришёл или не пришёл, загрузчик сообщает об этом своему **делегату** — экрану галереи. Ты уже писала делегатов в «Почтальоне», так что схема знакомая.

Тикет: «Открыла и закрыла десять альбомов — в памяти висят десять экранов галереи и десять загрузчиков». Тимлид смотрит на код: «Классика. Экран держит загрузчик, а загрузчик держит экран через `delegate`. Делегат должен быть слабым. Почини и заодно допиши реакцию экрана на загрузку — её так и не сделали».

### Новое в Swift
Вспомним, как устроено делегирование. Один объект что-то делает и сообщает о событиях другому — делегату. Кто такой делегат, описывает протокол, а сам делегат лежит в свойстве:

```swift
protocol PrintServiceDelegate {
    func printService(_ service: PrintService, didFinish orderNumber: Int)
}

class PrintService {
    var delegate: PrintServiceDelegate?

    func complete(orderNumber: Int) {
        delegate?.printService(self, didFinish: orderNumber)
    }
}
```

Чаще всего делегат — это **владелец** помощника. Экран заказа печати создаёт сервис, держит его в своём свойстве и сам становится его делегатом:

```swift
class PrintOrderScreen: PrintServiceDelegate {
    let service = PrintService()     // экран держит сервис

    init() {
        service.delegate = self      // сервис держит экран
    }

    func printService(_ service: PrintService, didFinish orderNumber: Int) {
        print("Заказ \(orderNumber) напечатан")
    }
}
```

Получился цикл: экран → сервис → экран. Именно такой, как в прошлых задачах.

**Решение — слабый делегат.** Сервис не владеет экраном, он только сообщает ему новости. Значит, ссылка на делегата должна быть слабой: `weak var delegate`. Но если просто дописать `weak`, Swift откажется собирать код:

```text
'weak' must not be applied to non-class-bound 'any PrintServiceDelegate';
consider adding a protocol conformance that has a class bound
```

Дело в том, что протоколу может соответствовать и структура. А структура — значение, ссылаться на неё слабо невозможно. Swift не знает, что делегатом будет именно класс, и запрещает `weak`.

Подсказку компилятор даёт сам: «ограничь протокол классами». Для этого после имени протокола пишут `: AnyObject`. Слово `AnyObject` ты встречала в «Гнезде»: это «любой объект класса». В объявлении протокола оно означает «этому протоколу могут соответствовать только классы»:

```swift
protocol PrintServiceDelegate: AnyObject {
    func printService(_ service: PrintService, didFinish orderNumber: Int)
}

class PrintService {
    weak var delegate: PrintServiceDelegate?
    // ...
}
```

Теперь всё собирается, и цикла нет. Посчитаем: у экрана одна сильная ссылка — от переменной, где он лежит. Слабая ссылка из сервиса не считается. Когда экран закрывают, его счётчик падает до нуля. Экран исчезает, отпускает сервис, и тот исчезает следом.

А если сервис переживёт экран — например, его кто-то сохранил отдельно, — в `delegate` окажется `nil`. Вызов `delegate?.printService(...)` тогда просто ничего не сделает.

> 💡 Запомни правило: свойство `delegate` почти всегда объявляют как `weak var`, а протокол делегата — с `: AnyObject`. Так устроены делегаты во всех библиотеках Apple.

### Задача
1. Нажми «Проверить», ничего не меняя. Код работает, но экраны галереи и загрузчики не освобождаются, а статус экрана не меняется.
2. Ограничь протокол `ImageLoaderDelegate` классами: `: AnyObject`.
3. Сделай свойство `delegate` в `ImageLoader` слабым: `weak var delegate: ImageLoaderDelegate?`.
4. Допиши методы делегата в расширении `GalleryScreen`:
   - `imageLoader(_:didLoad:)` — добавляет имя файла в конец `shownPhotos` и записывает в `statusText` строку `Загружено фото: N`, где N — сколько фото теперь в `shownPhotos`;
   - `imageLoader(_:didFailToLoad:)` — записывает в `statusText` строку `Не удалось загрузить: ` и имя файла. В `shownPhotos` ничего не добавляет.
5. Строку `loader.delegate = self` в `init` экрана не убирай.

### Пример
```swift
let screen = GalleryScreen(title: "Котики")
screen.loader.finishLoading("IMG_0801.jpg", success: true)
screen.statusText     // "Загружено фото: 1"
screen.loader.finishLoading("IMG_0802.jpg", success: false)
screen.statusText     // "Не удалось загрузить: IMG_0802.jpg"
screen.shownPhotos    // ["IMG_0801.jpg"]
```

Сценарий из редактора должен вывести:

```text
Загружено фото: 1
Загружено фото: 2
Не удалось загрузить: IMG_0503.jpg
Галерея освобождена: Отпуск 2025
Загрузчик освобождён
```

## @starter
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// 2. Делегат загрузчика. Ограничь протокол классами
protocol ImageLoaderDelegate {
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String)
    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String)
}

// Загрузчик миниатюр. О результате сообщает делегату
class ImageLoader {
    // 3. Сделай делегата слабым
    var delegate: ImageLoaderDelegate?

    // Сервер ответил: файл загружен (success = true) или нет
    func finishLoading(_ fileName: String, success: Bool) {
        if success {
            delegate?.imageLoader(self, didLoad: fileName)
        } else {
            delegate?.imageLoader(self, didFailToLoad: fileName)
        }
    }

    deinit {
        lifecycleLog.append("Загрузчик освобождён")
    }
}

// Экран галереи. Владеет загрузчиком и сам становится его делегатом
class GalleryScreen {
    let title: String
    let loader = ImageLoader()
    var shownPhotos: [String] = []
    var statusText = "Загрузка..."

    init(title: String) {
        self.title = title
        loader.delegate = self
    }

    deinit {
        lifecycleLog.append("Галерея освобождена: \(title)")
    }
}

// 4. Реакция экрана на события загрузчика
extension GalleryScreen: ImageLoaderDelegate {
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String) {
        // Добавь файл в shownPhotos и обнови statusText

    }

    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String) {
        // Обнови statusText

    }
}

// Сценарий из тикета: открыли альбом, пришли ответы сервера, экран закрыли
var gallery: GalleryScreen? = GalleryScreen(title: "Отпуск 2025")
gallery?.loader.finishLoading("IMG_0501.jpg", success: true)
print(gallery?.statusText ?? "Экран закрыт")
gallery?.loader.finishLoading("IMG_0502.jpg", success: true)
print(gallery?.statusText ?? "Экран закрыт")
gallery?.loader.finishLoading("IMG_0503.jpg", success: false)
print(gallery?.statusText ?? "Экран закрыт")

gallery = nil
for entry in lifecycleLog {
    print(entry)
}
```

## @solution
```swift
// Журнал памяти
var lifecycleLog: [String] = []

// 2. Делегат загрузчика. Ограничь протокол классами
protocol ImageLoaderDelegate: AnyObject {
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String)
    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String)
}

// Загрузчик миниатюр. О результате сообщает делегату
class ImageLoader {
    // 3. Сделай делегата слабым
    weak var delegate: ImageLoaderDelegate?

    // Сервер ответил: файл загружен (success = true) или нет
    func finishLoading(_ fileName: String, success: Bool) {
        if success {
            delegate?.imageLoader(self, didLoad: fileName)
        } else {
            delegate?.imageLoader(self, didFailToLoad: fileName)
        }
    }

    deinit {
        lifecycleLog.append("Загрузчик освобождён")
    }
}

// Экран галереи. Владеет загрузчиком и сам становится его делегатом
class GalleryScreen {
    let title: String
    let loader = ImageLoader()
    var shownPhotos: [String] = []
    var statusText = "Загрузка..."

    init(title: String) {
        self.title = title
        loader.delegate = self
    }

    deinit {
        lifecycleLog.append("Галерея освобождена: \(title)")
    }
}

// 4. Реакция экрана на события загрузчика
extension GalleryScreen: ImageLoaderDelegate {
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String) {
        // Добавь файл в shownPhotos и обнови statusText
        shownPhotos.append(fileName)
        statusText = "Загружено фото: \(shownPhotos.count)"
    }

    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String) {
        // Обнови statusText
        statusText = "Не удалось загрузить: \(fileName)"
    }
}

// Сценарий из тикета: открыли альбом, пришли ответы сервера, экран закрыли
var gallery: GalleryScreen? = GalleryScreen(title: "Отпуск 2025")
gallery?.loader.finishLoading("IMG_0501.jpg", success: true)
print(gallery?.statusText ?? "Экран закрыт")
gallery?.loader.finishLoading("IMG_0502.jpg", success: true)
print(gallery?.statusText ?? "Экран закрыт")
gallery?.loader.finishLoading("IMG_0503.jpg", success: false)
print(gallery?.statusText ?? "Экран закрыт")

gallery = nil
for entry in lifecycleLog {
    print(entry)
}
```

## @output
```
Загружено фото: 1
Загружено фото: 2
Не удалось загрузить: IMG_0503.jpg
Галерея освобождена: Отпуск 2025
Загрузчик освобождён
```

## @tests
```swift
func __t_same(_ value: Any?, _ object: AnyObject) -> Bool {
    guard let value else { return false }
    return (value as AnyObject) === object
}

// Реакция экрана на события загрузчика
lifecycleLog = []
do {
    let __t_screen = GalleryScreen(title: "Котики")
    __eq("До ответов сервера статус не меняется", __t_screen.statusText, "Загрузка...")
    __t_screen.loader.finishLoading("IMG_0801.jpg", success: true)
    __eq("Первое фото загружено: статус", __t_screen.statusText, "Загружено фото: 1", hint: "В imageLoader(_:didLoad:) добавь файл в shownPhotos, потом запиши в statusText: Загружено фото: и shownPhotos.count")
    __t_screen.loader.finishLoading("IMG_0802.jpg", success: true)
    __t_screen.loader.finishLoading("IMG_0803.jpg", success: true)
    __eq("Три фото загружены: статус", __t_screen.statusText, "Загружено фото: 3", hint: "Число в статусе - это количество фото в shownPhotos после добавления")
    __eq("Загруженные фото в shownPhotos по порядку", __t_screen.shownPhotos, ["IMG_0801.jpg", "IMG_0802.jpg", "IMG_0803.jpg"], hint: "Каждое загруженное фото добавляй в конец shownPhotos через append")
    __t_screen.loader.finishLoading("IMG_0804.jpg", success: false)
    __eq("Ошибка загрузки: статус", __t_screen.statusText, "Не удалось загрузить: IMG_0804.jpg", hint: "В imageLoader(_:didFailToLoad:) запиши в statusText: Не удалось загрузить: и имя файла")
    __eq("Файл с ошибкой не попал в shownPhotos", __t_screen.shownPhotos.count, 3, hint: "При ошибке загрузки shownPhotos не меняется")
    __t_screen.loader.finishLoading("IMG_0805.jpg", success: true)
    __eq("После ошибки загрузка продолжается: статус", __t_screen.statusText, "Загружено фото: 4")
}
__eq("Экран Котики закрыт: освобождены и экран, и его загрузчик", lifecycleLog.sorted(), ["Галерея освобождена: Котики", "Загрузчик освобождён"], hint: "Экран держит загрузчик, а загрузчик держит экран через delegate. Сделай делегата слабым: weak var delegate, а протокол ограничь классами: AnyObject")

// Экран закрыт, а загрузчик ещё жив
lifecycleLog = []
var __t_keptLoader: ImageLoader? = nil
do {
    let __t_screen = GalleryScreen(title: "Дача")
    __t_keptLoader = __t_screen.loader
    __t_screen.loader.finishLoading("IMG_0901.jpg", success: true)
    __eq("Экран Дача получил фото", __t_screen.shownPhotos, ["IMG_0901.jpg"])
    __ok("Пока экран открыт, он делегат загрузчика", __t_same(__t_screen.loader.delegate, __t_screen), hint: "Не убирай loader.delegate = self из init экрана")
}
__eq("Загрузчик ещё нужен кому-то, но закрытый экран освобождён", lifecycleLog, ["Галерея освобождена: Дача"], hint: "Загрузчик не владеет экраном. Ссылка delegate должна быть слабой: weak var delegate")
__ok("После закрытия экрана delegate загрузчика стал nil", __t_keptLoader?.delegate == nil)
__t_keptLoader?.finishLoading("IMG_0902.jpg", success: true)
__pass("Ответ сервера после закрытия экрана ничего не ломает")
__t_keptLoader = nil
__eq("Последняя ссылка на загрузчик убрана: он освобождён", lifecycleLog, ["Галерея освобождена: Дача", "Загрузчик освобождён"])

// Загрузчик работает с любым делегатом-классом
final class __t_SpyDelegate: ImageLoaderDelegate {
    var events: [String] = []
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String) { events.append("ok " + fileName) }
    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String) { events.append("fail " + fileName) }
}
let __t_spy = __t_SpyDelegate()
let __t_loader = ImageLoader()
__t_loader.delegate = __t_spy
__t_loader.finishLoading("IMG_1001.jpg", success: true)
__t_loader.finishLoading("IMG_1002.jpg", success: false)
__eq("Загрузчик сообщает делегату об успехе и ошибке", __t_spy.events, ["ok IMG_1001.jpg", "fail IMG_1002.jpg"], hint: "Метод finishLoading менять не нужно")
```

## @rules
- must: /\bprotocol\s+ImageLoaderDelegate\s*:\s*(?:[\w\s,&]*\b)?AnyObject\b/ :: Ограничь протокол классами: `protocol ImageLoaderDelegate: AnyObject`.
- must: /\bweak\s+var\s+delegate\s*:\s*(?:any\s+)?ImageLoaderDelegate\s*\?/ :: Сделай делегата слабым: `weak var delegate: ImageLoaderDelegate?`.

## @hint1
Сначала утечка. Пройди по ссылкам: экран держит загрузчик в свойстве `loader`, а загрузчик держит экран в свойстве `delegate` — ведь в `init` экрана написано `loader.delegate = self`. Это цикл. Загрузчик не владеет экраном, поэтому его ссылка на делегата должна быть слабой: допиши `weak` перед `var delegate`.

Если сделать только это, Swift сообщит об ошибке: слабой может быть только ссылка на класс, а протоколу могут соответствовать и структуры. Поэтому ограничь протокол классами: в объявлении `ImageLoaderDelegate` после имени поставь двоеточие и `AnyObject`.

Теперь методы делегата в расширении `GalleryScreen`. В методе про успешную загрузку две строки: добавить `fileName` в конец `shownPhotos`, а потом записать в `statusText` текст со вставкой количества элементов в `shownPhotos`. В методе про ошибку одна строка: записать в `statusText` текст со вставкой `fileName`.

## @hint2
Слабый делегат объявляется в двух местах — у протокола и у свойства:

```swift
protocol PrintServiceDelegate: AnyObject {
    func printService(_ service: PrintService, didFinish orderNumber: Int)
}

class PrintService {
    weak var delegate: PrintServiceDelegate?
}
```

Внутри методов расширения к свойствам экрана обращаются напрямую: `shownPhotos.append(...)`, `statusText = "..."`.

## @hint3
Протокол и свойство готовы, осталось заполнить методы:

```swift
protocol ImageLoaderDelegate: AnyObject {
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String)
    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String)
}

// в классе ImageLoader
weak var delegate: ImageLoaderDelegate?

extension GalleryScreen: ImageLoaderDelegate {
    func imageLoader(_ loader: ImageLoader, didLoad fileName: String) {
        shownPhotos.append(___)
        statusText = "Загружено фото: \(___)"
    }

    func imageLoader(_ loader: ImageLoader, didFailToLoad fileName: String) {
        statusText = ___
    }
}
```

В первом пропуске — имя пришедшего файла. Во втором — количество фото в `shownPhotos`. В третьем — строка `Не удалось загрузить: ` со вставкой имени файла.

## @hint4
Вот готовое решение:

{{solution}}

**Где была утечка.** Экран создаёт загрузчик и хранит его в `let loader` — это сильная ссылка, и так и должно быть: экран владеет загрузчиком. В `init` экран становится делегатом: `loader.delegate = self`. Пока `delegate` был сильным, загрузчик держал экран, и получался цикл. После `gallery = nil` у экрана оставалась одна ссылка — от загрузчика, а у загрузчика — от экрана.

**Что изменилось.** Теперь `delegate` слабый и счётчик экрана не увеличивает. Посчитаем: экран держит только переменная `gallery`. `gallery = nil` — у экрана 0 ссылок, срабатывает его `deinit`. Экран отпускает загрузчик, у того тоже 0 ссылок — и он освобождается следом. Поэтому в журнале сначала «Галерея освобождена», потом «Загрузчик освобождён».

**Зачем `: AnyObject`.** Слабая ссылка бывает только на объект класса: только он может исчезнуть, оставив вместо себя `nil`. Без ограничения протоколу мог бы соответствовать и `struct`, и Swift запрещает `weak`. `AnyObject` обещает: делегатом будет только класс.

**Что если загрузчик переживёт экран.** Тогда в его `delegate` окажется `nil`, и `delegate?.imageLoader(...)` просто ничего не сделает. Проверка как раз так и поступает: держит загрузчик отдельно, закрывает экран и присылает ещё один ответ сервера.

**Типичные ошибки:**

- `weak` добавлен, а протокол не ограничен классами — Swift не соберёт код;
- `AnyObject` добавлен, а `weak` забыт — код собирается, но цикл остался;
- в статусе количество посчитано до `append` — получится на единицу меньше;
- строка `loader.delegate = self` удалена — утечки нет, но экран больше ничего не узнаёт о загрузке.
