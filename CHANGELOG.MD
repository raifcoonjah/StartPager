# Changelog

## [Version 7.88.9]
- Added a rotating animation when you hover on "open-settings" button.
- Added quote feature, thats 100% offline!

Optimization:
- Added lazy loading and decoding for shortcuts images.
- Background images are now stored in IndexedDB as raw Blobs instead of
localStorage as base64 strings. localStorage is synchronous and forces
the browser to parse a multi-MB base64 string on every page load before
anything else can run. IndexedDB is async and stores binary data natively
(no ~33% base64 size inflation), so page load is no longer blocked by it.
- The accent color palette (used by time.js) is computed ONCE, right here,
at save time — instead of being re-derived from a full image decode on
every page load / background change.
- And many other optimization tweaks made with the help of claude.


## [Version 7.88.3]

- Removed auto-switch background due to multiple issues.
- Removal of useless time-wrapper code since its not used anymore.
- Improved performance by applying blur inside of sidebar only when its open, this change should be transparent to the end user.
- Added a copy to clipboard button.
- Enable darker background by default.
- White font color toggle has been removed.
- You can now increase the home font size up to 400px.

### MADE WITH THE HELP OF AI

- Background received some performance improvements, reduced the image size being fetch from picsum to 2560px, this should help reduce CPU usage.
- Several optimizations made to shortcuts feature.
- Several performance and optimizations made to dynamic color feature (over 50%)


## [Version 7.88.2]

- Added an option to automatically switch the background using three different intervals.
- Added a new dynamic color feature to automatically change the color of the time and bulma primary accent color based on the current wallpaper.
- Custom shortcuts is no longer in beta!
- Backup/restore is no longer in beta!
- Settings sidebar is now a big bigger.
- This release includes a lot of bug fixes & security improvements to different aspects of StartPager. **PLEASE NOTE, I USED CLAUDE TO HELP ME DEBUG RESOLVE SOME BUGS**

## [Version 7.88.1]

This is minor release however it also includes some stuff that I was working on in the background.

- Random wallpaper notification now includes a link to picsum photos directly in the notification.
- Random button has been redesigned with a simpler design.
- Shortcut icons were redesigned using the new blur effect design (Beta)
- 'White font color" toggle now applies the white color effect to Settings button and shortcut icon.

### Bug fixes:

- Fix changelog button and slightly redesigned "Version & Change Log".
- Fix text if no shortcut is stored.
- Fixed and temporarily remove the css used to align Random wallpaper button.
- Added border around shortcut button to improve visibility when using a light background.

## [Version 7.88.0]

- WelcomeModal has been redesigned again, this time it should look much better with much better improved animations.
- Settings sidebar has been completely redesigned, this new design brings a lot of UX improvements and fixes a lot of issues we had with the previous version.

### Bug fixes:

- Various bug fixes when using light theme.

## [Version 7.87.3]

- Added a new toggle to use a generic icon instead of website logo.
- Various fixes made to shortcut.js source code.
- If you add a subreddit link, for example reddit.com/r/homelab, shortcuts will display the subreddit name instead of the full url.
- Add a backup and restore feature (Still very much a beta)

# Bug fixes:

- Fix some bug with new darken toggle.

## [Version 7.87.2]

- Improve transparency of new settings button, it should now look a bit better.
- Improved stability of caching icons and added a notification to inform users of delay.
- Added a new "Darken background" to help with visibility at night.

## Bug fixes:

- Fix bug that causes a "white flash" when hovering on shortcut-icons.
- Fixes to animation and how the border is applied to shortcut-icons, things should be more stable now.

## [Version 7.87.1.1]

- Fix vintage font not saving after a reload.

## [Version 7.87.1]

- Added a new settings button, it should now be easier to see and click.
- Added an option to switch Time font to something a bit more vintage.
- Fixed a very important bug that causes slow downs when opening a new tab as it needs to connect to duckduckgo and fetch the favicon everytime for all shortcuts. Sadly some icons still need to fetched everytime but this fix should decrease the amount of time it takes. (hopefully in the future i'm able to find another solution for this!)
- Various light theme fixes and improvements.
- Reduce font-size of Notifications, this should make them look less out of place.
- Reorganized core.css and did some clean up.

#### Animations

##### This release includes several animation fixes

- Improved shortcut icon hover animation.
- Improved opening and closing settings-sidebar animation.

## [Version 7.87.0]

Final release of the year! To recap: last year I started from scratch with the goal of turning Saturn Startpage into a more modern and ultra-fast startpage, and it’s been super fun. We’re closer than ever to having (somewhat) feature parity with the original Saturn Startpage. I’m excited for next year and expect a new **stable** release around mid-February if everything goes well :)

## New features:

- Added an appearance option, allowing you to tweak various aspects of Startpager.
- Added an option to apply white text to all home page labels.
- Added an option to use a random wallpaper, fetched from picsum.photos. (Beta)
- Added option to change Time font size (up to 350px).

## [Version 7.86.4]

- All default shortcuts except Open settings were removed.
- Change icons providers to duckduckgo, should provide slightly better privacy.
- Add outline to `.the-pill`
- Minor bug fixes.

#### Shortcut icons

- Improve experience when hovering on shortcut icons.
- Increase the number of shortcut icons to 8 icons.

## [Version 7.85.0]

#### Settings

- Settings was slighly redesigned and was heavily reorganised to make things easier to navigate.
- Settings will now open from the right side.
- All Delete/cancel buttons now use a red ouline to make easier to distinct between them.
- Setting sidebar now includes a nice blur effect behind it, this works on both light and dark mode.

#### Custom shortcuts

- You can now display up to 6 shortcuts on the homescreen, for now you **cannot** rearrange them.

## [Version 7.84.0]

- Update to Bulma.css 1.0.4
- Setting sidebar now also includes the current version of Bulma.
- Several fixes to WelcomeModal
- Setting a background no longer requires a reload.
- StartPager now properly supports chromium-based browsers.
- Added slight border around pill icon.
- Fix bug that causes homepage text to disappear when using light theme.
- Update FontAwesome 5.15.4 -> 7.0.1 (Experimental)
- Added notification about deprecated Default shortcuts.

#### Settings sidebar

- If buttons have a single action (ex. erase..) they will use the `is-fullwidth` css.
- When pressing erase button instead of browser popup, a bulma css modal is shown to keep things consistent.

#### Shortcuts

- You can use add custom shortcuts, keep in mind this is still an expiremental feature and may contain bugs.

## [Version 7.81.3] - 2025-03-12

- Update to Bulma.css 1.0.3
- Switched to local bulma.css to improve loading speed, this may however result in a slightly bigger extention size.
- Hide `Opening {shortcut}` tooltip quicker (-500ms)

## [Version 7.81.2] - 2025-XX-XX

**Style**:

- Add a opacity affect on setting toggle or the pill.
- Add border radius to <code>line</code>
- Improve deletion warning description.
- Fixed confusing greeting header.
- Fix other minor bugs.
- All background notifications are now displayed using Bulma CSS `notification` class.
- Added support for gifs as background image. (Experimental)

**BUG**:

- Background reload inconsistency, backend is very buggy with new codebase (somehow?)

## [Version 7.81.1] - 2025-18-01

- Fix backgroud notification position.
- Fix a bug that caused the browser to become unresponsive when the username exceeded 20 characters.
- Remove debug `console.log` statements for shortcut key presses.
- Added a "Notification" when a shortcut is pressed.
- Replace twitter.com -> x.com (shortcut changed to x)
- Faster sidebar opening animation.

## [Version 7.81.0] - 2025-04-01

- Fix `reset_button` button.
- Fix bug that would trigger shortcuts if a shortcut letter was present inside a input/field.
- Fix a very old Saturn bug that caused a delay of 10-15 seconds before time is updated.
- Fix settings background color when switching to light theme.
- Revert back to manifest.json `v2` to fix some weird bugs.
- Remove `content_security_policy` from manifest.json
- Added "96px" icon to manifest.json
- Add `fontawesome v5.14` support.
- Updated `html header`.
- Add a welcome modal.
- Instead of using a single index.js file for everything, several new files were created: - settings.js -> for everything setting related including sidebar js code etc.. - time.js -> for everything related to username and time - keyboard.js (now named shortcut.js) -> for everything keyboard shortcut related. - background.js -> everything related to the background.

#### Shortcut:

- Added "G" to open gitlab
