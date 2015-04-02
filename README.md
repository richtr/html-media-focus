####<font color="red"> This proposal has now been deprecated</font>

<font color="red">Please refer to [whatwg/media-keys/ImplicitMediaControls.md](https://github.com/whatwg/media-keys/blob/gh-pages/ImplicitMediaControls.md) for the updated proposal.</font>

---

## HTML Media Focus

### Introduction

This proposal enables web pages to request media focus for any HTML media and for user agents to then _reflect_ the state and events of that media between the page and any hardware and software based media control interfaces available to a user.

**Media focus** allows us to use hardware and software-based media control interfaces to control and interact with ongoing web-based media. Examples of such media control interfaces include, but are not limited to: keyboard media keys, headphone buttons, lock screen interfaces and remote controls.

For the purpose of setting _media focus_ we define the following:

- a new empty content attribute on [&lt;video&gt;](https://html.spec.whatwg.org/multipage/embedded-content.html#the-video-element) and [&lt;audio&gt;](https://html.spec.whatwg.org/multipage/embedded-content.html#the-audio-element) elements called `remotecontrols`, and;
- a reflected attribute for the new content attribute (above) on [HTMLMediaElement](https://html.spec.whatwg.org/multipage/embedded-content.html#htmlmediaelement) called `remoteControls`.

### Example Usage

A media element can request media focus with the `remotecontrols` content attribute:

``` html
<video src="myvideo" autoplay controls remotecontrols>
<audio src="audio.mp3" remotecontrols>
```

A media element can also request media focus with the reflected `remoteControls` attribute:

``` html
<script>
  var myAudio = document.createElement('audio');
  myAudio.src = "audio.mp3";
  myAudio.remoteControls = true;
  // myAudio.outerHTML === "<audio src="audio.mp3" remotecontrols=""></audio>"
</script>
```

Any HTML media element that has a `remoteControls` content attribute is called a **focusable media element**.

Whenever a `playing` event is fired toward a _focusable media element_ it obtains _media focus_ and is now the **focused media element**. Only one _focusable media element_ can hold _media focus_ at a time. If another _focusable media element_ currently has _media focus_ then the user agent actively pauses that other _focusable media element_ before passing _media focus_ to the new element.

Any _focusable media element_ can re-gain _media focus_ whenever a `playing` event is fired toward that element (i.e. whenever `.play()` is called by in-page JavaScript or by the user via HTML media controls against that _focusable media element_).

### IDL

HTML Media Focus can be described more formally as follows:

``` WebIDL
partial interface HTMLMediaElement {
  attribute boolean remoteControls;
}

partial interface MediaController {
  attribute boolean remoteControls;
}
```

By default, `remoteControls` is always initially set to `false`.

Additional [&lt;video&gt; content attributes](https://html.spec.whatwg.org/multipage/embedded-content.html#the-video-element):

- `remotecontrols` - Whether to provide _media focus_ to this media resource on play and reflect its current state in media control interfaces.

Additional [&lt;audio&gt; content attributes](https://html.spec.whatwg.org/multipage/embedded-content.html#the-audio-element):

- `remotecontrols` - Whether to provide _media focus_ to this media resource on play and reflect its current state in media control interfaces.

### Design FAQ

#### Why is the scope of media focus on &lt;audio&gt; and &lt;video&gt; elements?

Different OS platforms introduce different requirements to allow applications to gain media focus. Having studied the different approaches, scoping on &lt;audio&gt; and &lt;video&gt; elements allows media focus to be applied in a fully cross-platform way. It also ensures that _media focus_ is only provided when media actually begins playing in the user agent and it provides an excellent foundation in which we can _reflect_ media control interface key presses against HTML media content and vice versa (see [this question below](#how-does-this-enable-interaction-with-hardware-and-software-media-control-interfaces)).

#### Why should this not be the default behavior on all &lt;audio&gt; and &lt;video&gt; elements?

There are two main issues with applying _media focus_ and media controls by default to all &lt;audio&gt; and &lt;video&gt; elements on the web:

1. Web pages can create short bursts of media for e.g. notifications or interstitial advertisements. If this functionality was applied by default to those &lt;audio&gt; and &lt;video&gt; elements then it would cause that media to take the focus away from more useful sources (e.g. Music services, YouTube videos).
2. Without a way to prioritize _media focus_ there would be no way to decide which media should be paused and which media should be played. In addition there would be no way to meaningfully display what media is being played in a media control interface and no way to apply track seeking from media control interfaces to in-page media.

#### How does this enable interaction with hardware and software media control interfaces?

We can reflect a _focused media element_'s state toward hardware and software based media control interfaces using logical mappings between the in-page _focused media element_ and any available media control interface keys.

When a user presses a button on any media control interface, its logical meaning can be supplied to the _focused media element_ via the existing infrastructure of HTMLMediaElement. For example, when a user clicks 'Play / Pause' on their headphone cord the user agent can then apply either a `play()` or `pause()` action, as appropriate, directly to the _focused media element_.

_Media focus_ enables user agents to relay standard media control interface key presses as [standard media events](https://html.spec.whatwg.org/multipage/embedded-content.html#mediaevents) toward the _focused media element_ as follows:

- playing
- pause
- seeking
- seeked
- volumechange

Similarly, any changes to the in-page _focused media element_ state can be reflected back to media control interfaces, such as [duration](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-duration) and [current time](https://html.spec.whatwg.org/multipage/embedded-content.html#dom-media-currenttime). For example, if a user pauses the _focused media element_ via any in-page media controls interface then this state can also be automatically reflected in all attached media control interfaces.

#### What about the forward and backward media control interface keys?

Many types of media control interfaces allow users to skip forward and backward to previous and next tracks in a 'playlist' like way. HTML currently avoids the need to statefully create and consume playlist media declaratively. Instead, such playlist-like functionality is currently implemented by web applications in their own JavaScript code.

To enable playlist-like media control interface keys we thus propose firing `previous` and `next` events at the current _focused media element_. When a user presses the 'next' button in a media control interface we would thus fire a `next` event directly at the _focused media element_ and the web page can then decide to handle that event or not.

The addition of these two events allows us to relay standard previous/next media control interface key presses toward the _focused media element_ as follows:

- Skip forward
- Skip backward

When we fire these events on the _focused media element_ it enables that element, through any appropriate media control interface, to skip forward and backward between tracks without playlist-like functionality needing to be pre-arranged ahead of time or declared in HTML [[example code](https://github.com/richtr/html-media-focus/blob/gh-pages/index.html#L118-L139)].

If another _focusable media element_ gains _media focus_ then future `next` and `previous` events will be fired only toward that object when it is the _focused media element_. Thus, we can enable full media controls to be used within web applications with the addition of these two event types.

#### How can a web app signal that it wants to retain media focus during media transitions?

When `previous` or `next` events are fired toward a _focused media element_ — typically caused by the user pressing related buttons in a media control interface — the web application must decide whether or not it wishes to handle such events.

If a web app does not handle `previous` or `next` events then no action is taken. The current _focused media element_ retains _media focus_ and remains unchanged in its current state.

If a web app does decide to handle `previous` or `next` events (to e.g. transition between some 'playlist' tracks) then it must, before the _focused media element's_ current event loop **runs-to-completion**, invoke the `play()` method against a _focusable media element_ (either itself or another _focusable media element_ available within its `document`).

When a `play()` method is invoked before the current _focused media element's_ event loop runs-to-completion then we set the _target_ of that method invocation (i.e. the `play()` method's associated `HTMLMediaElement` object) the _focused media element_ ([example code](https://github.com/richtr/html-media-focus/blob/52220642d339a638a419cb4bba00dbb585dae011/index.html#L118-L139)).

Similarly, when an `ended` event is fired toward the _focused media element_ and the web app then invokes `play()` against itself or another _focusable media element_ _before its event loop runs-to-completion_ then we set the target of that method invocation (i.e. the `play()` method's parent `HTMLMediaElement` object) to be the _focused media element_ ([example code](https://github.com/richtr/html-media-focus/blob/52220642d339a638a419cb4bba00dbb585dae011/index.html#L140-L150)).

In this way we enable stateless, just-in-time _media sessions_ to be managed by web apps without them losing their current _media focus_ during such transitions.

#### What about displaying media information in media control interfaces?

Some media control interfaces, such as home screen controls, allow a title and an icon of the currently playing media to be displayed to the user. Our proposal is to reuse [`title`](https://html.spec.whatwg.org/multipage/dom.html#attr-title) and [`poster`](https://html.spec.whatwg.org/multipage/embedded-content.html#attr-video-poster) attributes for this purpose (though the `poster` content attribute would then also need to be made available on the `HTMLAudioElement` interface).

If `title` or `poster` attributes are not provided then suitable defaults could be used (e.g. the web page's title and favicon).

#### What about the Web Audio API?

Firstly we should clearly state that there will be legitimate cases when media mixed through the Web Audio API should also be able to obtain _media focus_. The current blocker on enabling Web Audio API-generated media to hold 'audio focus' is the lack of suitable reflection between hardware and software based media control interfaces and Web Audio API objects.

Creating a new `AudioContext` object and then allowing that object to obtain `media focus` introduces a disconnect between the controls available in any typical media controls interface and the methods and events available to an `AudioContext` object.

At the current time, web developers are required to implement their own media interfaces for Web Audio API-generated content to introduce concepts like Play, Pause, Media Seeking and Media Skipping. It would be logical if web developers could re-use the machinery of HTMLMediaElement for this purpose.

If/when we are able to import Web Audio API-generated content in to an HTMLMediaElement object then we would be able to supply _media focus_ to this content in the same way as described in this document. Until that happens, supplying _media focus_ to Web Audio API generated content remains out-of-scope of this proposal.

### Demo

This repository contains a simple web-based demo that demonstrates how `remoteControls` should work and be enforced by user agents. You can view this demo [here](https://richtr.github.io/html-media-focus/).

### Feedback

If you have any questions or feedback on this proposal please [file an issue](https://github.com/richtr/html-media-focus/issues) against this repository and we can discuss further.
