/**
 * Camera Grid View Card — Home Assistant dashboard card.
 * Copyright (c) 2026 luigi-regolo. SPDX-License-Identifier: GPL-3.0-only.
 * No telemetry, remote scripts, external assets, or credentials.
 */
const CG_TAG = 'camera-grid-view-card';
const CG_EDITOR_TAG = 'camera-grid-view-card-editor';
const CG_DOMAINS = Object.freeze({
  image_entity: ['image'], motion_entity: ['binary_sensor'],
  last_event_entity: ['sensor', 'input_datetime'],
  battery_entity: ['sensor'],
  audio_state_entity: ['switch', 'input_boolean', 'binary_sensor', 'sensor'],
  audio_control_entity: ['switch', 'input_boolean'],
  recording_state_entity: ['switch', 'input_boolean', 'binary_sensor', 'sensor'],
  recording_control_entity: ['switch', 'input_boolean'],
  // Optional live camera (any integration). Live video is rendered by the native Home Assistant card.
  camera_entity: ['camera'],
});
const CG_DEFAULTS = Object.freeze({
  title: null, language: 'auto', eyebrow: 'CAMERA GRID VIEW CARD', show_eyebrow: true, show_title: true, theme_mode: 'auto',
  layout: 'auto', custom_columns: 3, controls_enabled: false, auto_popup_enabled: false, auto_popup_seconds: 15, cameras: [],
});
// Languages: Italian, English, German and French. The language follows the Home Assistant user; English is the fallback.
const CG_LANGS = Object.freeze([['it', 'Italiano'], ['en', 'English'], ['de', 'Deutsch'], ['fr', 'Français']]);
const CG_TR = {
  it: {
    defTitle: 'Telecamere', camN: 'Telecamera {n}', cams_1: '{n} telecamera', cams_n: '{n} telecamere',
    recent: '{n} con movimento recente', recentT: 'Ultimo movimento entro 1 ora',
    empty: 'Aggiungi una telecamera dall’editor grafico della card.',
    agoNow: 'adesso', agoMin: '{n} min fa', agoH_1: '{n} ora fa', agoH_n: '{n} ore fa', agoD_1: '{n} giorno fa', agoD_n: '{n} giorni fa',
    liveNa: 'Live non disponibile', liveStarting: 'Avvio live…', liveAria: 'Live: {name}',
    imgAlt: 'Ultima immagine: {name}', imgNa: 'Immagine non disponibile',
    details: 'Dettagli e stato', openAria: 'Apri dettaglio {name}', motionOnAria: ', movimento in corso', motionOnT: 'Movimento in corso',
    motion: 'Movimento', na: 'Non disponibile', batLow: 'Batteria bassa: {n}%',
    close: 'Chiudi', detailAria: 'Dettaglio {name}',
    cfAudioOn: 'Vuoi attivare audio per {name}?', cfAudioOff: 'Vuoi disattivare audio per {name}?',
    cfRecOn: 'Vuoi attivare registrazione per {name}?', cfRecOff: 'Vuoi disattivare registrazione per {name}?',
    cfAriaAudio: 'Conferma audio', cfAriaRec: 'Conferma registrazione', cancel: 'Annulla', confirm: 'Conferma',
    liveStart: 'Avvia live', liveStop: 'Ferma live', liveTitle: 'Live',
    lastImg: 'Ultima immagine rilevata', camImg: 'Immagine telecamera',
    noImgCfg: 'Immagine non disponibile. Configura un’entità image.* o camera.*',
    lastMotion: 'Ultimo movimento rilevato', noRecent: 'Non disponibile negli eventi recenti',
    audio: 'Audio', recState: 'Stato registrazione',
    sAudioOn: 'Attivo', sAudioOff: 'Disattivo', sRecOn: 'In registrazione', sRecOff: 'Non in registrazione',
    btnOff: 'Disattiva', btnOn: 'Attiva', battery: 'Batteria',
    moreImg: 'Apri dettagli immagine', moreCam: 'Apri dettagli telecamera',
    errStale: 'Stato modificato nel frattempo. Riapri il controllo e verifica lo stato attuale.',
    errAudio: 'Comando audio non riuscito: {msg}', errRec: 'Comando registrazione non riuscito: {msg}', errHA: 'Errore Home Assistant',
    secs: 'Sezioni', tCam: 'Telecamere', tMod: 'Moduli', tAsp: 'Aspetto',
    camDesc: 'Seleziona una telecamera, poi scegli l’entità live o l’ultima immagine e come appare nella dashboard.',
    fLive: 'Telecamera live (camera.*)', fLiveH: 'Facoltativa. Funziona con qualsiasi telecamera di Home Assistant e abilita il live nel popup.',
    fImg: 'Ultima immagine rilevata (image.*)', fImgH: 'Facoltativa se è configurata una telecamera live.',
    fName: 'Nome visualizzato',
    ckPrev: 'Mostra ultima immagine nella dashboard', ckPrevH: 'Disattivata di default per privacy. Il popup resta disponibile.',
    ckLive: 'Mostra il live nell’anteprima della dashboard', ckLiveH: 'Richiede una telecamera live e Mostra ultima immagine nella dashboard. Avvia un flusso video per ogni telecamera: usalo con parsimonia.',
    mvUp: 'Sposta su', mvDn: 'Sposta giù', delCam: 'Rimuovi telecamera', remove: 'Rimuovi {x}',
    add: '+ Aggiungi telecamera', noLimit: 'Nessun limite fisso al numero di telecamere.', noCam: 'Nessuna telecamera configurata.',
    modDesc: 'Scegli i moduli opzionali di ogni telecamera. Un modulo senza entità non compare nel popup. Seleziona prima la telecamera.',
    mMotion: 'Movimento', mMotionH: 'Sensore di movimento e data dell’ultimo movimento.',
    fMotion: 'Entità movimento (facoltativa)', fLast: 'Data ultimo movimento (facoltativa)',
    mAudio: 'Audio', mAudioH: 'Stato audio e controllo facoltativo.',
    fAudSt: 'Stato audio (facoltativo)', fAudCt: 'Controllo audio (facoltativo)', fAudCtH: 'Richiede switch.* o input_boolean.* comandabile.',
    ckAud: 'Consenti controllo audio per questa telecamera', ckAudH: 'Richiede anche Abilita i comandi reali in fondo a questa scheda.',
    mRec: 'Registrazione', mRecH: 'Stato della registrazione e controllo facoltativo.',
    fRecSt: 'Stato registrazione (facoltativo)', fRecCt: 'Controllo registrazione (facoltativo)', fRecCtH: 'Richiede switch.* o input_boolean.* che comandi realmente la registrazione di questa telecamera.',
    ckRec: 'Consenti controllo registrazione per questa telecamera', ckRecH: 'Richiede anche Abilita i comandi reali in fondo a questa scheda.',
    mBat: 'Batteria', mBatH: 'Livello della batteria della telecamera.', fBat: 'Batteria (facoltativa)',
    mAuto: 'Popup automatico', mAutoH: 'Apre il popup di questa telecamera quando arriva una nuova immagine rilevata.',
    ckAuto: 'Apri il popup a una nuova immagine rilevata', ckAutoH: 'Richiede anche l’opzione generale in fondo a questa scheda. Funziona solo con la dashboard aperta.',
    allCams: 'Tutte le telecamere', allCamsH: 'Queste impostazioni valgono per l’intera card.',
    mCmd: 'Comandi reali', mCmdH: 'La card è inizialmente in sola lettura. Abilita i comandi soltanto dopo aver verificato le entità configurate.',
    ckCmd: 'Abilita i comandi reali', ckCmdH: 'Permette il controllo audio e registrazione esclusivamente per le telecamere autorizzate. I permessi Home Assistant restano necessari.',
    ckAutoG: 'Apri il popup a una nuova immagine rilevata', ckAutoGH: 'Mostra automaticamente l’ultima immagine rilevata e la chiude dopo il tempo indicato. Solo con la dashboard aperta. Disattivato di default.',
    fSecs: 'Secondi prima della chiusura automatica (5–60)',
    noteHidden: 'Le anteprime nascoste impediscono la visualizzazione delle immagini nella dashboard, ma non sostituiscono le autorizzazioni di Home Assistant.',
    ckEye: 'Mostra intestazione superiore', fEye: 'Intestazione superiore', ckTitle: 'Mostra titolo', fTitle: 'Titolo',
    fTheme: 'Tema', thAuto: 'Auto (Home Assistant)', fLayout: 'Layout',
    layAuto: 'Automatico', lay1: '1 telecamera per riga', lay2: '2 telecamere per riga', lay4: '4 telecamere (griglia 2×2)', layCustom: 'Personalizzato',
    fCols: 'Numero colonne (1–12)',
    lang: 'Lingua', langAuto: 'Automatica (Home Assistant)', langH: 'Automatica segue la lingua dell’utente in Home Assistant. Se la lingua non è disponibile si usa l’inglese.'
  },
  en: {
    defTitle: 'Cameras', camN: 'Camera {n}', cams_1: '{n} camera', cams_n: '{n} cameras',
    recent: '{n} with recent motion', recentT: 'Last motion within 1 hour',
    empty: 'Add a camera from the card’s visual editor.',
    agoNow: 'now', agoMin: '{n} min ago', agoH_1: '{n} hour ago', agoH_n: '{n} hours ago', agoD_1: '{n} day ago', agoD_n: '{n} days ago',
    liveNa: 'Live not available', liveStarting: 'Starting live…', liveAria: 'Live: {name}',
    imgAlt: 'Last image: {name}', imgNa: 'Image not available',
    details: 'Details and status', openAria: 'Open details for {name}', motionOnAria: ', motion in progress', motionOnT: 'Motion in progress',
    motion: 'Motion', na: 'Not available', batLow: 'Low battery: {n}%',
    close: 'Close', detailAria: 'Details: {name}',
    cfAudioOn: 'Turn on audio for {name}?', cfAudioOff: 'Turn off audio for {name}?',
    cfRecOn: 'Turn on recording for {name}?', cfRecOff: 'Turn off recording for {name}?',
    cfAriaAudio: 'Confirm audio', cfAriaRec: 'Confirm recording', cancel: 'Cancel', confirm: 'Confirm',
    liveStart: 'Start live', liveStop: 'Stop live', liveTitle: 'Live',
    lastImg: 'Last detected image', camImg: 'Camera image',
    noImgCfg: 'Image not available. Set up an image.* or camera.* entity.',
    lastMotion: 'Last motion detected', noRecent: 'Not available in recent events',
    audio: 'Audio', recState: 'Recording status',
    sAudioOn: 'On', sAudioOff: 'Off', sRecOn: 'Recording', sRecOff: 'Not recording',
    btnOff: 'Turn off', btnOn: 'Turn on', battery: 'Battery',
    moreImg: 'Open image details', moreCam: 'Open camera details',
    errStale: 'The state changed in the meantime. Reopen the control and check the current state.',
    errAudio: 'Audio command failed: {msg}', errRec: 'Recording command failed: {msg}', errHA: 'Home Assistant error',
    secs: 'Sections', tCam: 'Cameras', tMod: 'Modules', tAsp: 'Appearance',
    camDesc: 'Select a camera, then choose its live entity or last image and how it appears on the dashboard.',
    fLive: 'Live camera (camera.*)', fLiveH: 'Optional. Works with any Home Assistant camera and enables live view in the popup.',
    fImg: 'Last detected image (image.*)', fImgH: 'Optional if a live camera is set.',
    fName: 'Display name',
    ckPrev: 'Show last image on the dashboard', ckPrevH: 'Off by default for privacy. The popup stays available.',
    ckLive: 'Show live in the dashboard preview', ckLiveH: 'Requires a live camera and Show last image on the dashboard. Starts a video stream for each camera: use it sparingly.',
    mvUp: 'Move up', mvDn: 'Move down', delCam: 'Remove camera', remove: 'Remove {x}',
    add: '+ Add camera', noLimit: 'There is no fixed limit to the number of cameras.', noCam: 'No camera configured.',
    modDesc: 'Choose the optional modules of each camera. A module without entities is not shown in the popup. Select the camera first.',
    mMotion: 'Motion', mMotionH: 'Motion sensor and date of the last motion.',
    fMotion: 'Motion entity (optional)', fLast: 'Last motion date (optional)',
    mAudio: 'Audio', mAudioH: 'Audio state and optional control.',
    fAudSt: 'Audio state (optional)', fAudCt: 'Audio control (optional)', fAudCtH: 'Requires a controllable switch.* or input_boolean.*.',
    ckAud: 'Allow audio control for this camera', ckAudH: 'Also requires Enable real commands at the bottom of this tab.',
    mRec: 'Recording', mRecH: 'Recording state and optional control.',
    fRecSt: 'Recording state (optional)', fRecCt: 'Recording control (optional)', fRecCtH: 'Requires a switch.* or input_boolean.* that really controls this camera’s recording.',
    ckRec: 'Allow recording control for this camera', ckRecH: 'Also requires Enable real commands at the bottom of this tab.',
    mBat: 'Battery', mBatH: 'Battery level of the camera.', fBat: 'Battery (optional)',
    mAuto: 'Automatic popup', mAutoH: 'Opens this camera’s popup when a new detected image arrives.',
    ckAuto: 'Open the popup on a new detected image', ckAutoH: 'Also requires the general option at the bottom of this tab. Works only with the dashboard open.',
    allCams: 'All cameras', allCamsH: 'These settings apply to the whole card.',
    mCmd: 'Real commands', mCmdH: 'The card starts read-only. Enable commands only after checking the configured entities.',
    ckCmd: 'Enable real commands', ckCmdH: 'Allows audio and recording control only for the authorised cameras. Home Assistant permissions still apply.',
    ckAutoG: 'Open the popup on a new detected image', ckAutoGH: 'Automatically shows the last detected image and closes it after the set time. Only with the dashboard open. Off by default.',
    fSecs: 'Seconds before automatic closing (5–60)',
    noteHidden: 'Hidden previews prevent images from showing on the dashboard, but they do not replace Home Assistant permissions.',
    ckEye: 'Show top label', fEye: 'Top label', ckTitle: 'Show title', fTitle: 'Title',
    fTheme: 'Theme', thAuto: 'Automatic (Home Assistant)', fLayout: 'Layout',
    layAuto: 'Automatic', lay1: '1 camera per row', lay2: '2 cameras per row', lay4: '4 cameras (2×2 grid)', layCustom: 'Custom',
    fCols: 'Number of columns (1–12)',
    lang: 'Language', langAuto: 'Automatic (Home Assistant)', langH: 'Automatic follows the user’s language in Home Assistant. If the language is not available, English is used.'
  },
  de: {
    defTitle: 'Kameras', camN: 'Kamera {n}', cams_1: '{n} Kamera', cams_n: '{n} Kameras',
    recent: '{n} mit aktueller Bewegung', recentT: 'Letzte Bewegung innerhalb 1 Stunde',
    empty: 'Füge im grafischen Editor der Karte eine Kamera hinzu.',
    agoNow: 'jetzt', agoMin: 'vor {n} Min.', agoH_1: 'vor {n} Stunde', agoH_n: 'vor {n} Stunden', agoD_1: 'vor {n} Tag', agoD_n: 'vor {n} Tagen',
    liveNa: 'Live nicht verfügbar', liveStarting: 'Live wird gestartet…', liveAria: 'Live: {name}',
    imgAlt: 'Letztes Bild: {name}', imgNa: 'Bild nicht verfügbar',
    details: 'Details und Status', openAria: 'Details zu {name} öffnen', motionOnAria: ', Bewegung erkannt', motionOnT: 'Bewegung erkannt',
    motion: 'Bewegung', na: 'Nicht verfügbar', batLow: 'Batterie schwach: {n}%',
    close: 'Schließen', detailAria: 'Details: {name}',
    cfAudioOn: 'Audio für {name} einschalten?', cfAudioOff: 'Audio für {name} ausschalten?',
    cfRecOn: 'Aufzeichnung für {name} einschalten?', cfRecOff: 'Aufzeichnung für {name} ausschalten?',
    cfAriaAudio: 'Audio bestätigen', cfAriaRec: 'Aufzeichnung bestätigen', cancel: 'Abbrechen', confirm: 'Bestätigen',
    liveStart: 'Live starten', liveStop: 'Live beenden', liveTitle: 'Live',
    lastImg: 'Zuletzt erkanntes Bild', camImg: 'Kamerabild',
    noImgCfg: 'Bild nicht verfügbar. Richte eine image.*- oder camera.*-Entität ein.',
    lastMotion: 'Zuletzt erkannte Bewegung', noRecent: 'In den letzten Ereignissen nicht verfügbar',
    audio: 'Audio', recState: 'Aufzeichnungsstatus',
    sAudioOn: 'Aktiv', sAudioOff: 'Inaktiv', sRecOn: 'Aufzeichnung läuft', sRecOff: 'Keine Aufzeichnung',
    btnOff: 'Ausschalten', btnOn: 'Einschalten', battery: 'Batterie',
    moreImg: 'Bilddetails öffnen', moreCam: 'Kameradetails öffnen',
    errStale: 'Der Zustand hat sich inzwischen geändert. Öffne die Steuerung erneut und prüfe den aktuellen Zustand.',
    errAudio: 'Audiobefehl fehlgeschlagen: {msg}', errRec: 'Aufzeichnungsbefehl fehlgeschlagen: {msg}', errHA: 'Home-Assistant-Fehler',
    secs: 'Bereiche', tCam: 'Kameras', tMod: 'Module', tAsp: 'Darstellung',
    camDesc: 'Wähle eine Kamera, dann ihre Live-Entität oder das letzte Bild und wie sie im Dashboard erscheint.',
    fLive: 'Live-Kamera (camera.*)', fLiveH: 'Optional. Funktioniert mit jeder Home-Assistant-Kamera und aktiviert Live im Popup.',
    fImg: 'Zuletzt erkanntes Bild (image.*)', fImgH: 'Optional, wenn eine Live-Kamera festgelegt ist.',
    fName: 'Anzeigename',
    ckPrev: 'Letztes Bild im Dashboard anzeigen', ckPrevH: 'Standardmäßig aus (Datenschutz). Das Popup bleibt verfügbar.',
    ckLive: 'Live in der Dashboard-Vorschau anzeigen', ckLiveH: 'Erfordert eine Live-Kamera und Letztes Bild im Dashboard anzeigen. Startet einen Videostream pro Kamera: sparsam verwenden.',
    mvUp: 'Nach oben', mvDn: 'Nach unten', delCam: 'Kamera entfernen', remove: '{x} entfernen',
    add: '+ Kamera hinzufügen', noLimit: 'Die Anzahl der Kameras ist nicht begrenzt.', noCam: 'Keine Kamera konfiguriert.',
    modDesc: 'Wähle die optionalen Module jeder Kamera. Ein Modul ohne Entitäten wird im Popup nicht angezeigt. Wähle zuerst die Kamera.',
    mMotion: 'Bewegung', mMotionH: 'Bewegungsmelder und Datum der letzten Bewegung.',
    fMotion: 'Bewegungs-Entität (optional)', fLast: 'Datum der letzten Bewegung (optional)',
    mAudio: 'Audio', mAudioH: 'Audiozustand und optionale Steuerung.',
    fAudSt: 'Audiozustand (optional)', fAudCt: 'Audiosteuerung (optional)', fAudCtH: 'Erfordert einen steuerbaren switch.* oder input_boolean.*.',
    ckAud: 'Audiosteuerung für diese Kamera erlauben', ckAudH: 'Erfordert außerdem Echte Befehle aktivieren am Ende dieses Bereichs.',
    mRec: 'Aufzeichnung', mRecH: 'Aufzeichnungsstatus und optionale Steuerung.',
    fRecSt: 'Aufzeichnungsstatus (optional)', fRecCt: 'Aufzeichnungssteuerung (optional)', fRecCtH: 'Erfordert einen switch.* oder input_boolean.*, der die Aufzeichnung dieser Kamera tatsächlich steuert.',
    ckRec: 'Aufzeichnungssteuerung für diese Kamera erlauben', ckRecH: 'Erfordert außerdem Echte Befehle aktivieren am Ende dieses Bereichs.',
    mBat: 'Batterie', mBatH: 'Batteriestand der Kamera.', fBat: 'Batterie (optional)',
    mAuto: 'Automatisches Popup', mAutoH: 'Öffnet das Popup dieser Kamera, wenn ein neues erkanntes Bild eintrifft.',
    ckAuto: 'Popup bei neuem erkannten Bild öffnen', ckAutoH: 'Erfordert außerdem die allgemeine Option am Ende dieses Bereichs. Funktioniert nur bei geöffnetem Dashboard.',
    allCams: 'Alle Kameras', allCamsH: 'Diese Einstellungen gelten für die ganze Karte.',
    mCmd: 'Echte Befehle', mCmdH: 'Die Karte startet im Nur-Lese-Modus. Aktiviere Befehle erst, nachdem du die konfigurierten Entitäten geprüft hast.',
    ckCmd: 'Echte Befehle aktivieren', ckCmdH: 'Erlaubt Audio- und Aufzeichnungssteuerung nur für die freigegebenen Kameras. Die Home-Assistant-Berechtigungen gelten weiterhin.',
    ckAutoG: 'Popup bei neuem erkannten Bild öffnen', ckAutoGH: 'Zeigt automatisch das zuletzt erkannte Bild und schließt es nach der eingestellten Zeit. Nur bei geöffnetem Dashboard. Standardmäßig aus.',
    fSecs: 'Sekunden bis zum automatischen Schließen (5–60)',
    noteHidden: 'Ausgeblendete Vorschauen verhindern die Anzeige von Bildern im Dashboard, ersetzen aber nicht die Berechtigungen von Home Assistant.',
    ckEye: 'Obere Zeile anzeigen', fEye: 'Obere Zeile', ckTitle: 'Titel anzeigen', fTitle: 'Titel',
    fTheme: 'Design', thAuto: 'Automatisch (Home Assistant)', fLayout: 'Layout',
    layAuto: 'Automatisch', lay1: '1 Kamera pro Zeile', lay2: '2 Kameras pro Zeile', lay4: '4 Kameras (2×2-Raster)', layCustom: 'Benutzerdefiniert',
    fCols: 'Anzahl der Spalten (1–12)',
    lang: 'Sprache', langAuto: 'Automatisch (Home Assistant)', langH: 'Automatisch folgt der Sprache des Benutzers in Home Assistant. Ist die Sprache nicht verfügbar, wird Englisch verwendet.'
  },
  fr: {
    defTitle: 'Caméras', camN: 'Caméra {n}', cams_1: '{n} caméra', cams_n: '{n} caméras',
    recent: '{n} avec mouvement récent', recentT: 'Dernier mouvement dans l’heure',
    empty: 'Ajoutez une caméra depuis l’éditeur visuel de la carte.',
    agoNow: 'à l’instant', agoMin: 'il y a {n} min', agoH_1: 'il y a {n} heure', agoH_n: 'il y a {n} heures', agoD_1: 'il y a {n} jour', agoD_n: 'il y a {n} jours',
    liveNa: 'Direct indisponible', liveStarting: 'Démarrage du direct…', liveAria: 'Direct : {name}',
    imgAlt: 'Dernière image : {name}', imgNa: 'Image indisponible',
    details: 'Détails et état', openAria: 'Ouvrir les détails de {name}', motionOnAria: ', mouvement en cours', motionOnT: 'Mouvement en cours',
    motion: 'Mouvement', na: 'Non disponible', batLow: 'Batterie faible : {n}%',
    close: 'Fermer', detailAria: 'Détails : {name}',
    cfAudioOn: 'Activer l’audio pour {name} ?', cfAudioOff: 'Désactiver l’audio pour {name} ?',
    cfRecOn: 'Activer l’enregistrement pour {name} ?', cfRecOff: 'Désactiver l’enregistrement pour {name} ?',
    cfAriaAudio: 'Confirmer l’audio', cfAriaRec: 'Confirmer l’enregistrement', cancel: 'Annuler', confirm: 'Confirmer',
    liveStart: 'Démarrer le direct', liveStop: 'Arrêter le direct', liveTitle: 'Direct',
    lastImg: 'Dernière image détectée', camImg: 'Image de la caméra',
    noImgCfg: 'Image indisponible. Configurez une entité image.* ou camera.*.',
    lastMotion: 'Dernier mouvement détecté', noRecent: 'Indisponible dans les événements récents',
    audio: 'Audio', recState: 'État de l’enregistrement',
    sAudioOn: 'Activé', sAudioOff: 'Désactivé', sRecOn: 'Enregistrement en cours', sRecOff: 'Pas d’enregistrement',
    btnOff: 'Désactiver', btnOn: 'Activer', battery: 'Batterie',
    moreImg: 'Ouvrir les détails de l’image', moreCam: 'Ouvrir les détails de la caméra',
    errStale: 'L’état a changé entre-temps. Rouvrez la commande et vérifiez l’état actuel.',
    errAudio: 'Échec de la commande audio : {msg}', errRec: 'Échec de la commande d’enregistrement : {msg}', errHA: 'Erreur Home Assistant',
    secs: 'Sections', tCam: 'Caméras', tMod: 'Modules', tAsp: 'Apparence',
    camDesc: 'Sélectionnez une caméra, puis choisissez son entité en direct ou sa dernière image et son affichage dans le tableau de bord.',
    fLive: 'Caméra en direct (camera.*)', fLiveH: 'Facultatif. Fonctionne avec toute caméra Home Assistant et active le direct dans la fenêtre de détails.',
    fImg: 'Dernière image détectée (image.*)', fImgH: 'Facultatif si une caméra en direct est configurée.',
    fName: 'Nom affiché',
    ckPrev: 'Afficher la dernière image dans le tableau de bord', ckPrevH: 'Désactivé par défaut pour la confidentialité. La fenêtre de détails reste disponible.',
    ckLive: 'Afficher le direct dans l’aperçu du tableau de bord', ckLiveH: 'Nécessite une caméra en direct et Afficher la dernière image dans le tableau de bord. Lance un flux vidéo par caméra : à utiliser avec parcimonie.',
    mvUp: 'Monter', mvDn: 'Descendre', delCam: 'Supprimer la caméra', remove: 'Supprimer {x}',
    add: '+ Ajouter une caméra', noLimit: 'Le nombre de caméras n’est pas limité.', noCam: 'Aucune caméra configurée.',
    modDesc: 'Choisissez les modules facultatifs de chaque caméra. Un module sans entités n’apparaît pas dans la fenêtre de détails. Sélectionnez d’abord la caméra.',
    mMotion: 'Mouvement', mMotionH: 'Détecteur de mouvement et date du dernier mouvement.',
    fMotion: 'Entité de mouvement (facultative)', fLast: 'Date du dernier mouvement (facultative)',
    mAudio: 'Audio', mAudioH: 'État audio et commande facultative.',
    fAudSt: 'État audio (facultatif)', fAudCt: 'Commande audio (facultative)', fAudCtH: 'Nécessite un switch.* ou input_boolean.* commandable.',
    ckAud: 'Autoriser la commande audio pour cette caméra', ckAudH: 'Nécessite aussi Activer les commandes réelles en bas de cette section.',
    mRec: 'Enregistrement', mRecH: 'État de l’enregistrement et commande facultative.',
    fRecSt: 'État de l’enregistrement (facultatif)', fRecCt: 'Commande d’enregistrement (facultative)', fRecCtH: 'Nécessite un switch.* ou input_boolean.* qui commande réellement l’enregistrement de cette caméra.',
    ckRec: 'Autoriser la commande d’enregistrement pour cette caméra', ckRecH: 'Nécessite aussi Activer les commandes réelles en bas de cette section.',
    mBat: 'Batterie', mBatH: 'Niveau de batterie de la caméra.', fBat: 'Batterie (facultative)',
    mAuto: 'Fenêtre automatique', mAutoH: 'Ouvre la fenêtre de cette caméra lorsqu’une nouvelle image détectée arrive.',
    ckAuto: 'Ouvrir la fenêtre à chaque nouvelle image détectée', ckAutoH: 'Nécessite aussi l’option générale en bas de cette section. Ne fonctionne qu’avec le tableau de bord ouvert.',
    allCams: 'Toutes les caméras', allCamsH: 'Ces réglages s’appliquent à toute la carte.',
    mCmd: 'Commandes réelles', mCmdH: 'La carte démarre en lecture seule. N’activez les commandes qu’après avoir vérifié les entités configurées.',
    ckCmd: 'Activer les commandes réelles', ckCmdH: 'Autorise la commande audio et d’enregistrement uniquement pour les caméras autorisées. Les autorisations de Home Assistant restent nécessaires.',
    ckAutoG: 'Ouvrir la fenêtre à chaque nouvelle image détectée', ckAutoGH: 'Affiche automatiquement la dernière image détectée et la ferme après le délai indiqué. Uniquement avec le tableau de bord ouvert. Désactivé par défaut.',
    fSecs: 'Secondes avant la fermeture automatique (5–60)',
    noteHidden: 'Les aperçus masqués empêchent l’affichage des images dans le tableau de bord, mais ne remplacent pas les autorisations de Home Assistant.',
    ckEye: 'Afficher le texte supérieur', fEye: 'Texte supérieur', ckTitle: 'Afficher le titre', fTitle: 'Titre',
    fTheme: 'Thème', thAuto: 'Automatique (Home Assistant)', fLayout: 'Disposition',
    layAuto: 'Automatique', lay1: '1 caméra par ligne', lay2: '2 caméras par ligne', lay4: '4 caméras (grille 2×2)', layCustom: 'Personnalisée',
    fCols: 'Nombre de colonnes (1–12)',
    lang: 'Langue', langAuto: 'Automatique (Home Assistant)', langH: 'Automatique suit la langue de l’utilisateur dans Home Assistant. Si la langue n’est pas disponible, l’anglais est utilisé.'
  }
};
function cgT(lang, key, vars) {
  let t = CG_TR[lang]?.[key];
  if (t == null) t = CG_TR.en[key];
  if (t == null) return key;
  return vars ? t.replace(/\{(\w+)\}/g, (m, x) => (vars[x] != null ? vars[x] : m)) : t;
}
const cgTP = (lang, key, n, vars) => cgT(lang, key + (n === 1 ? '_1' : '_n'), Object.assign({ n }, vars));
function cgBaseLang(hass) {
  const l = hass && ((hass.locale && hass.locale.language) || hass.language);
  return typeof l === 'string' ? l.toLowerCase().split(/[-_]/)[0] : 'en';
}
function cgPickLang(cfgLang, hass) {
  const l = cfgLang && cfgLang !== 'auto' ? cfgLang : cgBaseLang(hass);
  return CG_TR[l] ? l : 'en';
}
// Config without the optional title when it is only the translated default.
function cgOut(config) { const o = { ...config }; if (o.title === null) delete o.title; return o; }
function cgText(value, max=100) { return String(value ?? '').trim().slice(0,max); }
function cgEsc(value) { return String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function cgEntity(value, domains) {
  const id=cgText(value,160);
  return domains.includes(id.split('.')[0]) && /^[a-z0-9_]+\.[a-z0-9_]+$/.test(id) ? id : '';
}
function cgCamera(raw={}) {
  const r=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  const c={name:cgText(r.name,60),show_preview:r.show_preview===true,audio_control_enabled:r.audio_control_enabled===true,recording_control_enabled:r.recording_control_enabled===true,auto_popup:r.auto_popup===true,live_preview:r.live_preview===true};
  for(const [key,domains] of Object.entries(CG_DOMAINS)) c[key]=cgEntity(r[key],domains);
  return c;
}
function cgSeconds(v){const n=Math.round(Number(v));return v!=null&&v!==''&&Number.isFinite(n)?Math.max(5,Math.min(60,n)):15;}
function cgConfig(raw={}) {
  const r=raw && typeof raw==='object' && !Array.isArray(raw)?raw:{};
  return {
    type: 'custom:camera-grid-view-card',
    // No title saved = the translated default title (e.g. "Telecamere" / "Cameras").
    title:r.title==null?null:cgText(r.title,60),
    language:CG_LANGS.some(l=>l[0]===r.language)?r.language:'auto',
    eyebrow:cgText(r.eyebrow??CG_DEFAULTS.eyebrow,60),
    // Header label and title are shown unless explicitly switched off (existing dashboards are unchanged).
    show_eyebrow:r.show_eyebrow!==false,
    show_title:r.show_title!==false,
    theme_mode:['auto','light','dark'].includes(r.theme_mode)?r.theme_mode:'auto',
    layout:['auto','1','2','4','custom'].includes(String(r.layout))?String(r.layout):'auto',
    custom_columns:Number.isInteger(Number(r.custom_columns)) ? Math.max(1,Math.min(12,Number(r.custom_columns))) : 3,
    controls_enabled:r.controls_enabled===true,
    auto_popup_enabled:r.auto_popup_enabled===true,
    auto_popup_seconds:cgSeconds(r.auto_popup_seconds),
    // No fixed maximum: users decide how many camera panels to configure.
    cameras:Array.isArray(r.cameras)?r.cameras.map(cgCamera):[],
  };
}
function cgKnown(entity) {return !!entity && !['unknown','unavailable',''].includes(entity.state);}
function cgImageUrl(entity, bucket='') {
  if(!cgKnown(entity))return '';
  const url=entity?.attributes?.entity_picture;
  if(typeof url!=='string' || !url.startsWith('/') || url.startsWith('//') || url.includes('\\') || /[\x00-\x1f]/.test(url))return '';
  // Whitelist same-origin Home Assistant paths. Never accept external or javascript/data URLs.
  // `bucket` refreshes still images of camera entities (their state does not change with each frame).
  const v=encodeURIComponent(String(entity.state).slice(0,100)+(bucket!==''?`-${String(bucket).slice(0,20)}`:''));
  return v?`${url}${url.includes('?')?'&':'?'}cg_v=${v}`:url;
}
// Smartphone = shortest side of the physical screen below 600 px (portrait and landscape).
// The viewport alone is not reliable: some containers report a window wider than the real screen.
function cgIsPhone(scr=(typeof window!=='undefined'?window.screen:null)) {
  const w=Number(scr?.width),h=Number(scr?.height);
  return Number.isFinite(w)&&Number.isFinite(h)&&w>0&&h>0&&Math.min(w,h)<600;
}
function cgTime(iso, now=Date.now(), lang='it') {
  if(typeof iso!=='string')return null;
  const ms=Date.parse(iso);
  if(!Number.isFinite(ms)||ms>now+60000)return null;
  const min=Math.floor(Math.max(0,now-ms)/60000);
  const relative=min<1?cgT(lang,'agoNow'):min<60?cgT(lang,'agoMin',{n:min}):min<1440?cgTP(lang,'agoH',Math.floor(min/60)):cgTP(lang,'agoD',Math.floor(min/1440));
  const exact=new Intl.DateTimeFormat(lang,{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(ms));
  return {ms,relative,exact};
}
function cgLatestMovement(rows, fromMs) {
  if(!Array.isArray(rows))return null;
  let best=null;
  for(const row of rows){
    if(!Array.isArray(row))continue;
    for(let i=1;i<row.length;i++){
      if(row[i]?.state==='on'&&row[i-1]?.state!=='on'){
        const iso=row[i].last_changed||row[i].last_updated;
        const t=Date.parse(iso);
        if(Number.isFinite(t)&&t>=fromMs&&(!best||t>Date.parse(best)))best=iso;
      }
    }
  }
  return best;
}
function cgBoolState(entity){
  if(!cgKnown(entity))return null;
  if(entity.state==='on')return true;
  if(entity.state==='off')return false;
  return null;
}
const cgIcon=(name)=>`<ha-icon icon="mdi:${name}" aria-hidden="true"></ha-icon>`;
const CG_STYLE=`
:host{display:block;box-sizing:border-box;color:var(--primary-text-color,#18221c);font-family:var(--ha-font-family-body,var(--paper-font-body1_-_font-family,Roboto,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif));font-size:14px}
*,*:before,*:after{box-sizing:border-box}button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:not-allowed;opacity:.45}
ha-icon{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;flex-shrink:0;--mdc-icon-size:21px;width:21px;height:21px}
.cg-root{--cg-accent:#0a7156;--cg-muted:#56675c;--cg-surface:#f0f2ef;--cg-circle:#fff;--cg-border:#e0e5df;--cg-bg:#fafbf9;--cg-fg:#18221c;background:var(--cg-bg);color:var(--cg-fg);font-family:inherit;font-size:14px;font-weight:400;border:1px solid var(--cg-border);border-radius:26px;padding:18px;min-width:0;position:relative}
.cg-root.cg-dark{--cg-accent:#0e795d;--cg-muted:#bbc5bd;--cg-surface:#191c1a;--cg-circle:#282b29;--cg-border:#2b302c;--cg-bg:#101211;--cg-fg:#f5f7f4}
.cg-head{margin:2px 4px 17px}.cg-eyebrow{font-size:10px;letter-spacing:1.7px;font-weight:750;color:var(--cg-muted);margin-bottom:7px}.cg-title{font-size:25px;line-height:1.14;font-weight:780;letter-spacing:-.7px;overflow-wrap:anywhere}.cg-title b{color:var(--cg-accent);font-weight:800}
.cg-grid-host{container:cg-camera-grid/inline-size;min-width:0;width:100%}
.cg-grid{display:grid;grid-template-columns:repeat(var(--cg-cols,2),minmax(0,1fr));gap:12px}
.cg-cell{border:1px solid var(--cg-border);background:var(--cg-surface);color:inherit;padding:7px 10px;height:auto;min-height:82px;border-radius:16px;display:flex;flex-direction:column;gap:2px;justify-content:space-between;text-align:left;min-width:0;transition:border-color .16s,transform .16s}.cg-cell.cg-with-preview{height:auto;min-height:82px}
.cg-cell:hover,.cg-cell:focus{border-color:var(--cg-accent)}.cg-cell:active{transform:scale(.99)}.cg-cell:focus-visible,.cg-btn:focus-visible,.cg-confirm-btn:focus-visible{outline:2px solid var(--cg-accent);outline-offset:2px}
.cg-top{display:flex;align-items:center;gap:10px;min-width:0}.cg-icon-orb{display:grid;place-items:center;flex:none;width:43px;height:43px;border-radius:50%;background:var(--cg-circle)}.cg-icon-orb ha-icon{color:var(--cg-fg);width:22px;height:22px;--mdc-icon-size:22px}
.cg-info{flex:1;min-width:0}.cg-name{display:block;font-size:13px;font-weight:600;line-height:1.3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cg-arrow{display:flex;color:var(--cg-muted)}.cg-arrow ha-icon{width:14px;height:14px;--mdc-icon-size:14px}
.cg-preview{width:100%;aspect-ratio:16/10;border-radius:12px;background:var(--cg-circle);object-fit:cover;display:block}.cg-placeholder{border:1px dashed var(--cg-border);border-radius:12px;min-height:70px;display:flex;align-items:center;gap:9px;justify-content:center;color:var(--cg-muted);font-size:11px}
.cg-open-badge{align-self:flex-start;display:inline-flex;align-items:center;gap:5px;padding:5px 9px;border-radius:999px;background:var(--cg-accent);color:#fff;font-size:11px;font-weight:650;line-height:1.2}.cg-open-badge ha-icon{--mdc-icon-size:14px;width:14px;height:14px;color:#fff}
.cg-meta{font-size:11.5px;color:var(--cg-muted);line-height:1.3;overflow-wrap:anywhere}.cg-info .cg-meta{display:block;margin-top:3px}.cg-empty{padding:12px;color:var(--cg-muted);font-size:12px}
.cg-backdrop{position:fixed;inset:0;overscroll-behavior:contain;z-index:9999;background:#0009;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top)) max(16px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(16px,env(safe-area-inset-left))}.cg-dialog{width:min(390px,100%);height:min(calc(100vh - 40px),680px);height:min(calc(100dvh - 40px),680px);display:flex;flex-direction:column;background:var(--cg-bg);color:var(--cg-fg);border:1px solid var(--cg-border);border-radius:26px;overflow:hidden;box-shadow:0 18px 60px #0005}
.cg-dialog-body{overflow-y:auto;overscroll-behavior:contain;padding:12px 18px 18px;min-width:0}
.cg-dialog-head{flex:none;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 16px 12px 18px;background:var(--cg-bg);border-bottom:1px solid var(--cg-border)}.cg-dialog-head strong{flex:1;min-width:0;margin:0;font-size:17px;font-weight:600;line-height:1.3;overflow-wrap:anywhere}.cg-icon-btn{flex:none;width:40px;height:40px;border-radius:50%;border:1px solid var(--cg-border);background:var(--cg-surface);color:var(--cg-fg);display:grid;place-items:center;padding:0}.cg-icon-btn ha-icon{--mdc-icon-size:20px;width:20px;height:20px}.cg-icon-btn:focus-visible{outline:2px solid var(--cg-accent);outline-offset:2px}
.cg-snapshot-box{margin:12px 0;border-radius:17px;background:var(--cg-surface);padding:15px;text-align:center}.cg-snapshot-title{font-size:12px;font-weight:650;color:var(--cg-muted);margin-bottom:9px}.cg-snapshot{display:block;width:100%;max-height:340px;object-fit:contain;border-radius:12px}
.cg-event{margin-top:9px;padding:11px 12px;border-radius:14px;background:var(--cg-surface);border:1px solid var(--cg-border);display:flex;gap:10px;align-items:center;min-height:67px;font-size:12px}.cg-event-icon{display:grid;place-items:center;background:var(--cg-circle);width:38px;height:38px;border-radius:50%;flex:none}.cg-event-icon ha-icon{color:var(--cg-fg)}.cg-event-text{flex:1;min-width:0}.cg-event strong{font-weight:600}.cg-event .cg-meta{display:block;margin-top:3px}.cg-btn{border:1px solid var(--cg-border);border-radius:999px;padding:8px 11px;background:var(--cg-circle);color:var(--cg-fg);font-size:12px;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}.cg-btn:disabled{opacity:.45}
.cg-wide{display:block;width:100%;border:0;border-radius:14px;margin-top:13px;padding:13px;background:var(--cg-accent);color:white;font-weight:730;font-size:inherit;text-align:center}.cg-wide ha-icon{color:#fff;--mdc-icon-size:18px;width:18px;height:18px;margin-right:7px}.cg-error{margin-top:12px;color:#c74f4f;font-size:12px}.cg-dialog-text{font-size:13px;color:var(--cg-muted);line-height:1.5;margin:10px 0 14px}.cg-dialog-buttons{display:flex;gap:9px}.cg-dialog-buttons .cg-btn,.cg-dialog-buttons .cg-wide{flex:1;justify-content:center;display:flex;align-items:center;margin-top:0}
@media(max-width:420px){.cg-root{padding:13px;border-radius:23px}.cg-cell{padding:7px 8px;gap:2px;height:77px}.cg-cell.cg-with-preview{height:auto;min-height:77px}.cg-icon-orb{width:36px;height:36px}.cg-name{font-size:11.5px}.cg-meta{font-size:10.5px}.cg-title{font-size:23px}.cg-open-badge{font-size:10px;padding:5px 8px}}
/* Container-based adaptation: dashboard columns can be narrow even on wide screens.
   Keep the approved 2-column compact geometry whenever the host is wide enough. */
@container cg-camera-grid (max-width:480px){
  .cg-grid{grid-template-columns:repeat(var(--cg-narrow-cols,2),minmax(0,1fr))}
  .cg-cell,.cg-cell.cg-with-preview{height:auto;min-height:82px;padding:9px 8px;gap:7px}
  .cg-top{gap:6px;min-width:0}
  .cg-icon-orb{width:34px;height:34px}
  .cg-icon-orb ha-icon{width:18px;height:18px;--mdc-icon-size:18px}
  .cg-arrow ha-icon{width:12px;height:12px;--mdc-icon-size:12px}
  .cg-info .cg-meta{line-height:1.35;overflow-wrap:break-word}
  .cg-open-badge{max-width:100%;flex-shrink:0;min-width:0;padding:5px 7px;gap:4px;font-size:10px;white-space:normal;overflow-wrap:break-word}
}
@container cg-camera-grid (max-width:280px){.cg-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.cg-cell{transition:none}.cg-cell:active{transform:none}}

.cg-root{padding:14px}
.cg-root .cg-head{margin:2px 4px 12px}
.cg-root .cg-title{font-size:23px}
.cg-root .cg-grid{gap:8px}
.cg-root .cg-cell,.cg-root .cg-cell.cg-with-preview{border-radius:20px;padding:10px;gap:8px;min-height:0;height:auto}
.cg-root .cg-icon-orb{width:38px;height:38px}
.cg-root .cg-icon-orb ha-icon{width:20px;height:20px;--mdc-icon-size:20px}
.cg-root .cg-cell .cg-name{font-size:14px}
.cg-root .cg-cell .cg-meta{font-size:12px;line-height:1.35}
.cg-root .cg-cell .cg-preview,.cg-root .cg-cell .cg-placeholder{border-radius:14px}

.cg-root{--cg-amber:#8a5a00;--cg-amber-bg:#f6ead0}
.cg-root.cg-dark{--cg-amber:#e8b04d;--cg-amber-bg:#3a2d12}
.cg-root .cg-head{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:10px 12px}
.cg-chips{display:flex;gap:6px;flex-wrap:wrap}
.cg-chip{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--cg-border);background:var(--cg-surface);border-radius:999px;padding:5px 9px;font-size:11px;font-weight:600;line-height:1.2;color:var(--cg-muted)}
.cg-chip ha-icon{width:14px;height:14px;--mdc-icon-size:14px}
.cg-chip.on{color:var(--cg-fg)}.cg-chip.on ha-icon{color:var(--cg-accent)}
.cg-icon-orb{position:relative}
.cg-motion{position:absolute;top:-1px;right:-1px;width:11px;height:11px;border-radius:50%;background:var(--cg-accent);border:2px solid var(--cg-surface)}
.cg-foot{display:flex;align-items:center;flex-wrap:wrap;gap:6px;min-width:0}
.cg-root .cg-cell .cg-meta{display:block}
.cg-root .cg-cell .cg-k{display:block;font-size:10.5px;line-height:1.3;letter-spacing:.15px}
.cg-root .cg-cell .cg-v{display:block;font-size:12px;line-height:1.35;font-weight:600;color:var(--cg-fg)}


.cg-root{--cg-btn-fg:var(--cg-accent)}
.cg-root.cg-dark{--cg-btn-fg:var(--cg-fg)}
.cg-root .cg-open-badge{align-self:stretch;flex:1;min-width:0;width:100%;justify-content:center;gap:6px;min-height:36px;padding:8px 12px;font-size:12.5px;font-weight:600;line-height:1.2;border-radius:999px;color:var(--cg-btn-fg);border:1px solid color-mix(in srgb,var(--cg-accent) 45%,transparent);background:color-mix(in srgb,var(--cg-accent) 12%,transparent);transition:background .15s}
.cg-root .cg-open-badge ha-icon{color:inherit;--mdc-icon-size:16px;width:16px;height:16px}
.cg-root .cg-cell:hover .cg-open-badge,.cg-root .cg-cell:focus-visible .cg-open-badge{background:color-mix(in srgb,var(--cg-accent) 20%,transparent)}
.cg-root .cg-cell{container:cg-cell/inline-size}
.cg-root .cg-open-badge{white-space:nowrap;flex:1 1 auto;min-width:max-content}
/* Narrow tiles (tablets, many columns): keep the label on one line by compacting the button. */
@container cg-cell (max-width:175px){.cg-root .cg-open-badge{font-size:11px;padding:8px;gap:3px;min-height:34px}.cg-root .cg-open-badge ha-icon{--mdc-icon-size:14px;width:14px;height:14px}}
@container cg-cell (max-width:175px){.cg-root .cg-arrow{display:none}.cg-root .cg-cell .cg-v{font-size:11.5px}.cg-root .cg-cell .cg-icon-orb{width:32px;height:32px}.cg-root .cg-cell .cg-top{gap:5px}}
@container cg-cell (max-width:150px){.cg-root .cg-cell .cg-v{font-size:10.5px}}
@container cg-cell (max-width:145px){.cg-root .cg-open-badge ha-icon{display:none}}
@container cg-cell (max-width:128px){.cg-root .cg-open-badge{font-size:10px;padding:7px 5px;min-height:32px}}
@container cg-cell (max-width:112px){.cg-root .cg-open-badge{white-space:normal;min-width:0;line-height:1.15}}
.cg-bat{display:inline-flex;align-items:center;gap:3px;flex:none;border-radius:999px;padding:3px 8px 3px 5px;background:var(--cg-amber-bg);color:var(--cg-amber);font-size:11px;font-weight:700}.cg-bat b{font-weight:700}.cg-bat ha-icon{width:14px;height:14px;--mdc-icon-size:14px;color:var(--cg-amber)}
@container cg-cell (max-width:175px){.cg-root .cg-bat{padding:4px}.cg-root .cg-bat b{display:none}}

/* Popup (standard v1.4): fixed height on every device, content scrolls inside the body, header stays still. */
.cg-dialog.cg-compact{height:auto;max-height:min(88vh,680px)}
.cg-dialog-body{flex:1 1 auto;min-height:0}
.cg-pop-media,.cg-pop-info{min-width:0}
.cg-pop-info>.cg-event:first-child{margin-top:0}
.cg-snapshot-box{display:block}
.cg-live-actions{display:flex;justify-content:center;margin-top:11px}
.cg-live-btn{min-height:36px;justify-content:center}
/* Tablet and desktop only (never smartphones: .cg-phone is set from the physical screen size): wide horizontal popup in columns. */
@media(min-width:640px) and (min-height:600px){
  .cg-backdrop:not(.cg-phone) .cg-dialog:not(.cg-compact){width:min(1120px,100%);height:min(80vh,560px);height:min(80dvh,560px)}
  .cg-backdrop:not(.cg-phone) .cg-pop-grid{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(260px,1fr);gap:14px;align-items:start}
  .cg-backdrop:not(.cg-phone) .cg-pop-grid .cg-snapshot-box{margin:0}
}
/* Live video (native Home Assistant card projected through named slots). */
.cg-live-box{position:relative;width:100%;aspect-ratio:16/10;border-radius:14px;overflow:hidden;background:var(--cg-circle)}
.cg-live-box ::slotted(*){position:absolute;inset:0;display:block;width:100%;height:100%;overflow:hidden;border-radius:inherit;--ha-card-border-radius:0px;--ha-card-box-shadow:none;--ha-card-border-width:0px}
.cg-cell .cg-live-box ::slotted(*){pointer-events:none}
.cg-live-popup{width:min(100%,544px);margin:0 auto}
.cg-live-badge{position:absolute;top:8px;left:8px;z-index:2;display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;background:var(--cg-accent);color:#fff;font-size:10px;font-weight:700;letter-spacing:.6px;line-height:1.2;pointer-events:none}
.cg-live-note{position:absolute;inset:0;display:grid;place-items:center;color:var(--cg-muted);font-size:11px;text-align:center;padding:8px}

`;
class CameraGridViewCard extends HTMLElement {
  static getStubConfig(){return cgOut(cgConfig());}
  static getConfigElement(){return document.createElement(CG_EDITOR_TAG);}
  constructor(){
    super();this.attachShadow({mode:'open'});this._config=cgConfig();this._hass=null;this._opened=null;
    this._busy=false;this._error='';this._confirmation=null;this._lastSignature='';this._movement=new Map();this._querying=new Set();this._autoTimer=null;this._autoOpened=false;this._autoCloseAt=0;this._autoLast=new Map();this._popupLive=false;this._liveEls=new Map();this._liveFail=false;
    this.shadowRoot.addEventListener('click',event=>this._click(event));
    this.shadowRoot.addEventListener('keydown',event=>{if(event.key==='Escape'&&this._opened!==null)this._close();});
    this._onAppearance=()=>this._paint();
    this._media=typeof window!=='undefined'&&typeof window.matchMedia==='function'?window.matchMedia('(prefers-color-scheme:dark)'):null;
  }
  connectedCallback(){this._media?.addEventListener?.('change',this._onAppearance);this._paint();this._syncLive();}
  disconnectedCallback(){this._media?.removeEventListener?.('change',this._onAppearance);this._clearAuto();this._stopLive();}
  setConfig(raw){this._clearAuto();this._config=cgConfig(raw);this._opened=null;this._popupLive=false;this._liveFail=false;this._confirmation=null;this._movement.clear();this._lastSignature='';this._paint();}
  set hass(hass){const prev=this._hass;this._hass=hass;this._detect(prev,hass);for(const w of this._liveEls.values()){if(w.card)w.card.hass=hass;}this._paint();}
  getCardSize(){return Math.max(2,Math.ceil(this._config.cameras.length/2)*2+1);}
  _lang(){return cgPickLang(this._config.language,this._hass);}
  _t(k,v){return cgT(this._lang(),k,v);}
  _tp(k,n){return cgTP(this._lang(),k,n);}
  _clearAuto(){clearTimeout(this._autoTimer);this._autoTimer=null;this._autoOpened=false;this._autoCloseAt=0;}
  _detect(prev,hass){
    const cfg=this._config;
    if(!cfg.auto_popup_enabled||!prev||!hass?.states)return;
    if(typeof document!=='undefined'&&document.visibilityState==='hidden')return;
    const now=Date.now();let hit=-1;
    cfg.cameras.forEach((c,i)=>{
      if(!c.auto_popup||!c.image_entity)return;
      const a=prev.states?.[c.image_entity],b=hass.states[c.image_entity];
      // Only a genuine new image: both states known and different (no popup on reconnect or unavailable).
      if(!cgKnown(a)||!cgKnown(b)||a.state===b.state)return;
      if(now-(this._autoLast.get(i)||0)<2000)return;
      this._autoLast.set(i,now);hit=i;
    });
    if(hit<0)return;
    // Never interrupt a popup opened by the user or a pending command confirmation.
    if((this._opened!==null&&!this._autoOpened)||this._confirmation||this._busy)return;
    this._clearAuto();
    this._opened=hit;this._popupLive=false;this._error='';this._lastSignature='';this._autoOpened=true;
    const ms=cfg.auto_popup_seconds*1000;this._autoCloseAt=now+ms;
    this._autoTimer=setTimeout(()=>{if(this._autoOpened&&this._opened===hit&&!this._confirmation&&!this._busy)this._close();else this._clearAuto();},ms);
    this._loadMovement(cfg.cameras[hit]);
  }
  _state(id){return id?this._hass?.states?.[id]:undefined;}
  _isDark(){return this._config.theme_mode==='dark'||(this._config.theme_mode==='auto'&&(this._hass?.themes?.darkMode===true||(!this._hass?.themes&&this._media?.matches)));}
  _lastEvent(c){
    const e=this._state(c.last_event_entity);const raw=c.last_event_entity&&cgKnown(e)?e.state:null;
    if(raw&&cgTime(raw))return raw;
    const motion=this._state(c.motion_entity);
    if(cgBoolState(motion)===true&&cgTime(motion.last_changed))return motion.last_changed;
    return this._movement.get(c.motion_entity)||null;
  }
  _name(c,i){return c.name||this._state(c.image_entity)?.attributes?.friendly_name||this._state(c.camera_entity)?.attributes?.friendly_name||this._t('camN',{n:i+1});}
  // Still image: the event snapshot (image.*) when configured, otherwise the camera entity picture, refreshed every minute.
  _still(c){
    if(c.image_entity)return cgImageUrl(this._state(c.image_entity));
    if(c.camera_entity)return cgImageUrl(this._state(c.camera_entity),Math.floor(Date.now()/60000));
    return '';
  }
  _liveNote(){return `<div class="cg-live-note">${cgEsc(this._t(this._liveFail?'liveNa':'liveStarting'))}</div>`;}
  _row(c,i){
    const title=this._name(c,i);
    // Dashboard privacy: no image element, stream or image URL when the preview is disabled.
    const image=c.show_preview?this._still(c):'';
    const liveTile=c.show_preview&&c.live_preview&&!!c.camera_entity;
    const visual=liveTile?`<div class="cg-live-box" aria-label="${cgEsc(this._t('liveAria',{name:title}))}"><span class="cg-live-badge">LIVE</span><slot name="cg-live-tile-${i}">${this._liveNote()}</slot></div>`:c.show_preview?(image?`<img class="cg-preview" alt="${cgEsc(this._t('imgAlt',{name:title}))}" src="${cgEsc(image)}" loading="lazy"/>`:'<div class="cg-placeholder">'+cgIcon('image-off-outline')+cgEsc(this._t('imgNa'))+'</div>'):'';
    const last=cgTime(this._lastEvent(c),Date.now(),this._lang());
    const mot=this._state(c.motion_entity);const motionOn=cgBoolState(mot)===true;
    const bs=this._state(c.battery_entity);const bn=Number(bs?.state);
    const lowBat=!!c.battery_entity&&cgKnown(bs)&&Number.isFinite(bn)&&bn>=0&&bn<20;
    const badge=`<span class="cg-open-badge">${cgEsc(this._t('details'))} ${cgIcon('chevron-right')}</span>`;
    return `<button type="button" class="cg-cell ${c.show_preview?'cg-with-preview':''}" data-open="${i}" aria-label="${cgEsc(this._t('openAria',{name:title}))}${motionOn?cgEsc(this._t('motionOnAria')):''}"><div class="cg-top"><span class="cg-icon-orb">${cgIcon('cctv')}${motionOn?`<i class="cg-motion" title="${cgEsc(this._t('motionOnT'))}"></i>`:''}</span><span class="cg-info"><span class="cg-name">${cgEsc(title)}</span><span class="cg-meta"><span class="cg-k">${cgEsc(this._t('motion'))}</span><span class="cg-v">${cgEsc(last?last.relative:this._t('na')).replace(/ /g,'\u00a0')}</span></span></span>${lowBat?`<span class="cg-bat" title="${cgEsc(this._t('batLow',{n:Math.round(bn)}))}">${cgIcon('battery-alert')}<b>${Math.round(bn)}%</b></span>`:`<span class="cg-arrow">${cgIcon('chevron-right')}</span>`}</div>${visual}<span class="cg-foot">${badge}</span></button>`;
  }
  _status(c,kind){
    const stateId=c[`${kind}_state_entity`], controlId=c[`${kind}_control_entity`];
    return cgBoolState(this._state(stateId||controlId));
  }
  _popup(index){
    const c=this._config.cameras[index];if(!c)return '';
    const title=this._name(c,index);
    const phone=cgIsPhone();
    const head=`<div class="cg-dialog-head"><strong>${cgEsc(title)}</strong><button class="cg-icon-btn" type="button" data-close="1" aria-label="${cgEsc(this._t('close'))}">${cgIcon('close')}</button></div>`;
    if(this._confirmation){
      const confirm=this._confirmation;
      const k=confirm.kind==='audio'?'Audio':'Rec';
      const text=this._t(`cf${k}${confirm.expected?'Off':'On'}`,{name:title});
      return `<div class="cg-backdrop${phone?' cg-phone':''}" data-backdrop="1"><div class="cg-dialog cg-compact" role="dialog" aria-modal="true" aria-label="${cgEsc(this._t('cfAria'+k))}">${head}<div class="cg-dialog-body"><div class="cg-dialog-text">${cgEsc(text)}</div><div class="cg-dialog-buttons"><button type="button" class="cg-btn" data-cancel="1">${cgEsc(this._t('cancel'))}</button><button type="button" class="cg-wide" data-confirm="1" ${this._busy?'disabled':''}>${cgEsc(this._t('confirm'))}</button></div>${this._error?`<div class="cg-error" role="alert">${cgEsc(this._error)}</div>`:''}</div></div></div>`;
    }
    const url=this._still(c);
    const last=cgTime(this._lastEvent(c),Date.now(),this._lang());
    const bat=this._state(c.battery_entity);const n=Number(bat?.state);
    const battery=c.battery_entity&&cgKnown(bat)&&Number.isFinite(n)&&n>=0&&n<=100?Math.round(n):null;
    // Live video starts only on an explicit tap and stops when the popup closes.
    const hasCam=!!c.camera_entity;
    const liveOn=hasCam&&this._popupLive;
    const camKnown=cgKnown(this._state(c.camera_entity));
    const liveBtn=hasCam?`<button type="button" class="cg-btn cg-live-btn" data-live="${liveOn?'stop':'start'}" ${camKnown?'':'disabled'}>${cgIcon(liveOn?'stop-circle-outline':'video')}${cgEsc(this._t(liveOn?'liveStop':'liveStart'))}</button>`:'';
    const still=url?`<img class="cg-snapshot" src="${cgEsc(url)}" alt="${cgEsc(this._t(c.image_entity?'lastImg':'camImg'))}: ${cgEsc(title)}"/>`:`<div class="cg-placeholder">${cgEsc(this._t('noImgCfg'))}</div>`;
    const media=liveOn?`<div class="cg-live-box cg-live-popup" aria-label="${cgEsc(this._t('liveAria',{name:title}))}"><span class="cg-live-badge">LIVE</span><slot name="cg-live-popup">${this._liveNote()}</slot></div>`:still;
    let content='';
    content+=`<div class="cg-snapshot-box"><div class="cg-snapshot-title">${cgEsc(this._t(liveOn?'liveTitle':(c.image_entity||!hasCam)?'lastImg':'camImg'))}</div>${media}${liveBtn?`<div class="cg-live-actions">${liveBtn}</div>`:''}</div>`;
    let info='';
    info+=`<div class="cg-event"><span class="cg-event-icon">${cgIcon('motion-sensor')}</span><div class="cg-event-text"><strong>${cgEsc(this._t('lastMotion'))}</strong><div class="cg-meta">${last?cgEsc(last.relative)+' · '+cgEsc(last.exact):cgEsc(this._t('noRecent'))}</div></div></div>`;
    for(const kind of ['audio','recording']){
      if(!c[`${kind}_state_entity`]&&!c[`${kind}_control_entity`])continue;
      const state=this._status(c,kind);
      const control=c[`${kind}_control_entity`];
      const switchState=cgBoolState(this._state(control));
      const authorized=this._config.controls_enabled&&c[`${kind}_control_enabled`]&&!!control&&switchState!==null;
      const label=this._t(state===true?(kind==='audio'?'sAudioOn':'sRecOn'):state===false?(kind==='audio'?'sAudioOff':'sRecOff'):'na');
      const action=authorized?`<button type="button" class="cg-btn" data-request="${kind}:${index}" ${this._busy?'disabled':''}>${cgEsc(this._t(switchState?'btnOff':'btnOn'))}</button>`:'';
      info+=`<div class="cg-event"><span class="cg-event-icon">${cgIcon(kind==='audio'?'microphone':'cctv')}</span><div class="cg-event-text"><strong>${cgEsc(this._t(kind==='audio'?'audio':'recState'))}</strong><div class="cg-meta">${label}</div></div>${action}</div>`;
    }
    if(c.battery_entity&&battery!==null)info+=`<div class="cg-event"><span class="cg-event-icon">${cgIcon('battery')}</span><div class="cg-event-text"><strong>${cgEsc(this._t('battery'))}</strong><div class="cg-meta">${battery}%</div></div></div>`;
    const moreId=c.image_entity||c.camera_entity;
    if(moreId)info+=`<button type="button" class="cg-wide" data-more="${cgEsc(moreId)}">${cgIcon('arrow-expand')}${cgEsc(this._t(c.image_entity?'moreImg':'moreCam'))}</button>`;
    if(this._error)info+=`<div class="cg-error" role="alert">${cgEsc(this._error)}</div>`;
    return `<div class="cg-backdrop${phone?' cg-phone':''}" data-backdrop="1"><div class="cg-dialog" role="dialog" aria-modal="true" aria-label="${cgEsc(this._t('detailAria',{name:title}))}">${head}<div class="cg-dialog-body"><div class="cg-pop-grid"><div class="cg-pop-media">${content}</div><div class="cg-pop-info">${info}</div></div></div></div></div>`;
  }
  _signature(){
    const ids=this._config.cameras.flatMap(c=>Object.keys(CG_DOMAINS).map(k=>c[k]).filter(Boolean));
    const rows=[...new Set(ids)].map(id=>{const e=this._state(id);return [id,e?.state,e?.last_changed,e?.attributes?.entity_picture];});
    return JSON.stringify([this._config,rows,this._opened,this._busy,this._error,this._confirmation,[...this._movement],this._isDark(),Math.floor(Date.now()/60000),this._popupLive,this._liveFail,this._lang()]);
  }
  _paint(){
    if(!this.shadowRoot||!this.isConnected)return;
    const sig=this._signature();if(sig===this._lastSignature)return;this._lastSignature=sig;
    const cfg=this._config;
    const nowMs=Date.now();
    const recent=cfg.cameras.filter(c=>{const t=cgTime(this._lastEvent(c),nowMs);return !!t&&nowMs-t.ms<3600000;}).length;
    const nCam=cfg.cameras.length;
    const chips=nCam?`<div class="cg-chips"><span class="cg-chip">${cgIcon('cctv')}${cgEsc(this._tp('cams',nCam))}</span>${recent?`<span class="cg-chip on" title="${cgEsc(this._t('recentT'))}">${cgIcon('motion-sensor')}${cgEsc(this._t('recent',{n:recent}))}</span>`:''}</div>`:'';
    // Label and title can be switched off; the camera-count chips stay visible.
    const headText=(cfg.show_eyebrow?`<div class="cg-eyebrow">${cgEsc(cfg.eyebrow)}</div>`:'')+(cfg.show_title?`<div class="cg-title">${cgEsc(cfg.title==null?this._t('defTitle'):cfg.title)}<b>.</b></div>`:'');
    const headHtml=headText||chips?`<div class="cg-head">${headText?`<div>${headText}</div>`:''}${chips}</div>`:'';
    const columns=cfg.layout==='auto'?2:cfg.layout==='1'?1:cfg.layout==='2'?2:cfg.layout==='4'?2:cfg.custom_columns;
    const bodyTop=this.shadowRoot.querySelector?.('.cg-dialog-body')?.scrollTop||0;
    this.shadowRoot.innerHTML=`<style>${CG_STYLE}</style><div class="cg-root ${this._isDark()?'cg-dark':'cg-light'}" style="--cg-cols:${columns};--cg-narrow-cols:${cfg.layout==='1'?1:2}">${headHtml}${cfg.cameras.length?`<div class="cg-grid-host"><div class="cg-grid">${cfg.cameras.map((c,i)=>this._row(c,i)).join('')}</div></div>`:`<div class="cg-empty">${cgEsc(this._t('empty'))}</div>`}${this._opened!==null?this._popup(this._opened):''}</div>`;
    if(bodyTop){const b=this.shadowRoot.querySelector('.cg-dialog-body');if(b)b.scrollTop=bodyTop;}
    // Keep keyboard focus inside the popup (on the close button) so Escape works; never move focus if it is already on a popup control.
    if(this._opened!==null&&!this.shadowRoot.activeElement){const x=this.shadowRoot.querySelector('[data-close]');x?.focus?.({preventScroll:true});}
    this._syncLive();
  }
  // Live video is rendered by the native Home Assistant card (picture-entity, camera_view: live).
  // The native element lives in the light DOM and is projected into the shadow DOM through named slots,
  // so repainting the card never restarts a running stream.
  _liveKeys(){
    const keys=new Map();
    this._config.cameras.forEach((c,i)=>{if(c.show_preview&&c.live_preview&&c.camera_entity)keys.set(`tile-${i}`,c.camera_entity);});
    if(this._opened!==null&&this._popupLive&&!this._confirmation){const c=this._config.cameras[this._opened];if(c?.camera_entity)keys.set('popup',c.camera_entity);}
    return keys;
  }
  _syncLive(){
    if(typeof document==='undefined'||typeof this.appendChild!=='function'||!this.isConnected)return;
    const want=this._liveKeys();
    for(const [key,w] of [...this._liveEls]){if(want.get(key)!==w.entity){w.node.remove();this._liveEls.delete(key);}}
    for(const [key,entity] of want){if(!this._liveEls.has(key))this._mountLive(key,entity);}
  }
  _mountLive(key,entity){
    const node=document.createElement('div');node.slot=`cg-live-${key}`;node.className='cg-live-wrap';
    const w={entity,node,card:null};this._liveEls.set(key,w);this.appendChild(node);
    (async()=>{
      try{
        const helpers=await window.loadCardHelpers?.();
        if(typeof helpers?.createCardElement!=='function')throw new Error('card helpers unavailable');
        const card=await helpers.createCardElement({type:'picture-entity',entity,camera_view:'live',show_name:false,show_state:false,tap_action:{action:'none'},hold_action:{action:'none'}});
        if(this._liveEls.get(key)!==w)return; // stopped meanwhile
        card.hass=this._hass;w.card=card;node.appendChild(card);
      }catch{
        if(this._liveEls.get(key)===w){this._liveFail=true;this._lastSignature='';this._paint();}
      }
    })();
  }
  _stopLive(){for(const w of this._liveEls.values())w.node.remove();this._liveEls.clear();}
  _close(){this._clearAuto();this._opened=null;this._popupLive=false;this._confirmation=null;this._error='';this._lastSignature='';this._paint();}
  async _loadMovement(c){
    if(!c.motion_entity||c.last_event_entity||this._querying.has(c.motion_entity)||typeof this._hass?.callApi!=='function')return;
    this._querying.add(c.motion_entity);
    const from=Date.now()-7*86400000;
    const endpoint=`history/period/${new Date(from).toISOString()}?filter_entity_id=${encodeURIComponent(c.motion_entity)}&no_attributes=1&significant_changes_only=0`;
    try {const rows=await this._hass.callApi('GET',endpoint);const latest=cgLatestMovement(rows,from);if(latest)this._movement.set(c.motion_entity,latest);}
    catch { /* Recorder history is optional; missing history must not be invented. */ }
    finally {this._querying.delete(c.motion_entity);this._lastSignature='';this._paint();}
  }
  _requestControl(kind,index){
    const c=this._config.cameras[index];
    if(!c||this._opened!==index||!this._config.controls_enabled||!c[`${kind}_control_enabled`]||this._busy)return;
    const id=c[`${kind}_control_entity`];
    if(!id||!['switch','input_boolean'].includes(id.split('.')[0]))return;
    const state=cgBoolState(this._state(id));if(state===null)return;
    this._confirmation={kind,index,entity_id:id,expected:state};
    this._error='';this._lastSignature='';this._paint();
  }
  async _performControl(kind,index,expected=null){
    const c=this._config.cameras[index],id=c?.[`${kind}_control_entity`];
    if(!c||!this._config.controls_enabled||!c[`${kind}_control_enabled`]||this._busy||!id)return;
    const domain=id.split('.')[0];if(!['switch','input_boolean'].includes(domain))return;
    const state=cgBoolState(this._state(id));if(state===null)return;
    if(expected!==null&&state!==expected){this._error=this._t('errStale');this._confirmation=null;this._lastSignature='';this._paint();return;}
    if(typeof this._hass?.callService!=='function')return;
    this._busy=true;this._error='';this._lastSignature='';this._paint();
    try {await this._hass.callService(domain,state?'turn_off':'turn_on',{entity_id:id});this._confirmation=null;}
    catch(err){this._confirmation=null;this._error=this._t(kind==='audio'?'errAudio':'errRec',{msg:cgText(err?.message||this._t('errHA'),140)});}
    finally {this._busy=false;this._lastSignature='';this._paint();}
  }
  async _toggleAudio(index){return this._performControl('audio',index);}
  async _toggleRecording(index){return this._performControl('recording',index);}
  _click(event){
    this._clearAuto();
    if(event.target?.dataset?.backdrop==='1'){this._close();return;}
    if(event.target.closest('[data-close]')){this._close();return;}
    if(event.target.closest('[data-cancel]')){this._confirmation=null;this._lastSignature='';this._paint();return;}
    if(event.target.closest('[data-confirm]')){
      const p=this._confirmation;if(!p)return;
      const cam=this._config.cameras[p.index];
      if(!cam||cam[`${p.kind}_control_entity`]!==p.entity_id){this._confirmation=null;this._lastSignature='';this._paint();return;}
      this._performControl(p.kind,p.index,p.expected);return;
    }
    const live=event.target.closest('[data-live]');if(live){if(this._opened===null)return;this._popupLive=live.dataset.live==='start';this._liveFail=false;this._lastSignature='';this._paint();return;}
    const more=event.target.closest('[data-more]');if(more){const id=more.dataset.more;this._close();this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:id},bubbles:true,composed:true}));return;}
    const request=event.target.closest('[data-request]');if(request){const [kind,idx]=request.dataset.request.split(':');if(['audio','recording'].includes(kind))this._requestControl(kind,Number(idx));return;}
    const btn=event.target.closest('[data-open]');if(btn){const idx=Number(btn.dataset.open);if(!this._config.cameras[idx])return;this._opened=idx;this._popupLive=false;this._confirmation=null;this._error='';this._lastSignature='';this._paint();this._loadMovement(this._config.cameras[idx]);}
  }

}
const CG_EDITOR_CSS=`
:host{display:block;color:var(--primary-text-color,#18221c);font-family:var(--ha-font-family-body,Roboto,Arial,sans-serif);font-size:var(--ha-font-size-m,14px)}
*,*:before,*:after{box-sizing:border-box}
.cg-editor{display:block}
.cg-tabs{display:flex;gap:5px;overflow-x:auto;padding-bottom:14px;border-bottom:1px solid var(--divider-color,#dfe5df)}
.cg-tab{border:0;background:none;color:var(--secondary-text-color,#536359);border-radius:13px;padding:10px 13px;white-space:nowrap;font:inherit;cursor:pointer}
.cg-tab.active{color:var(--primary-text-color,#17231c);background:var(--secondary-background-color,#f0f2ef);font-weight:650}
.cg-heading{font-size:21px;font-weight:500;margin:25px 0 9px}
.cg-desc{color:var(--secondary-text-color,#55665a);font-size:13px;line-height:1.5;margin-bottom:24px}
.cg-field{display:block;margin:20px 0}
.cg-label{font-size:14px;margin-bottom:10px}
.cg-input{display:block;width:100%;background:var(--secondary-background-color,#f0f2ef);color:var(--primary-text-color,#18221c);border:0;border-bottom:1px solid var(--divider-color,#a5afa5);padding:14px 13px;min-height:50px;border-radius:11px 11px 0 0;font:inherit}
.cg-editor ha-selector{display:block;width:100%;--mdc-theme-primary:var(--primary-color,#0b7457)}
.cg-fallback{display:none}.cg-no-native .cg-fallback{display:block}.cg-no-native ha-selector{display:none}
.cg-row{border-bottom:1px solid var(--divider-color,#e3e7e3);padding:13px 0;display:flex;align-items:center;justify-content:space-between;gap:15px}
.cg-row label{flex:1}.cg-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--primary-color,#0c7157)}
.cg-muted{font-size:12px;line-height:1.5;color:var(--secondary-text-color,#5e6c62)}
.cg-action{background:var(--secondary-background-color,#eff2ee);border:1px solid var(--divider-color,#dbe2db);color:var(--primary-text-color,#18221c);padding:10px 14px;border-radius:14px;font:inherit;cursor:pointer}
.cg-action:disabled{opacity:.45;cursor:not-allowed}
.cg-tiny{font-size:11px;color:var(--secondary-text-color,#55665a);margin:9px 0}
.cg-input:focus-visible,.cg-action:focus-visible,.cg-tab:focus-visible,.cg-clear:focus-visible{outline:2px solid var(--primary-color,#0b7457);outline-offset:2px}
.cg-mod{border-bottom:1px solid var(--divider-color,#dfe5df);padding:16px 0}
.cg-mod-nm{font-weight:600;font-size:15px}
.cg-mod-d{margin-top:6px}
.cg-mod-b{margin-top:10px}
.cg-selector-line{display:flex;align-items:center;gap:8px;min-width:0}
.cg-selector-grow{flex:1;min-width:0}
.cg-clear{display:flex;align-items:center;justify-content:center;flex:none;width:36px;height:36px;background:var(--secondary-background-color,#eef1ef);border:1px solid var(--divider-color,#dfe5df);border-radius:50%;cursor:pointer;color:var(--secondary-text-color,#57655c);padding:0}
.cg-clear ha-icon{width:18px;height:18px;--mdc-icon-size:18px}
.cg-camera-group{padding-bottom:20px}
.cg-camera-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:20px}.cg-camera-picker{display:flex;gap:5px;overflow-x:auto;border-bottom:1px solid var(--divider-color,#dfe5df);padding:14px 0 12px}.cg-camera-chip{border:0;border-radius:13px;padding:10px 12px;flex:none;background:none;color:var(--secondary-text-color,#536359);font:inherit;font-size:13px;cursor:pointer}.cg-camera-chip.active{background:var(--secondary-background-color,#f0f2ef);color:var(--primary-text-color,#17231c);font-weight:650}
.cg-camera-head strong{font-size:15px;font-weight:600}
.cg-controls{display:flex;gap:6px;flex:none}
.cg-controls .cg-action{padding:5px 9px;border-radius:10px}
.cg-add{display:block;margin:12px 0 25px}
.cg-notice{margin-top:10px;color:var(--error-color,#bd4b42);font-size:12px}
`;
class CameraGridViewCardEditor extends HTMLElement {
  constructor(){
    super();this.attachShadow({mode:'open'});this._config=cgConfig();this._hass=null;this._nativeTried=false;
    this._tab='telecamere';this._selectedCamera=0;
    this.shadowRoot.addEventListener('click',e=>this._click(e));
    this.shadowRoot.addEventListener('change',e=>this._change(e));
  }
  set hass(hass){
    const first=!this._hass;this._hass=hass;
    // The first Home Assistant object tells which language the user speaks: redraw once with the right texts.
    if(first&&this.shadowRoot.querySelector('.cg-editor')&&this._config.language==='auto')this._render();
    else this.shadowRoot.querySelectorAll('ha-selector').forEach(el=>el.hass=hass);
  }
  setConfig(raw){
    const config=cgConfig(raw);
    if(JSON.stringify(config)===JSON.stringify(this._config)&&this.shadowRoot.querySelector('.cg-editor'))return;
    this._config=config;this._selectedCamera=Math.min(this._selectedCamera,Math.max(0,config.cameras.length-1));this._render();
  }
  connectedCallback(){this._render();this._ensureNative();}
  async _ensureNative(){
    if(this._nativeTried)return;this._nativeTried=true;
    if(!customElements.get('ha-selector')){
      try{const helper=await window.loadCardHelpers?.();await helper?.importSelector?.();}
      catch {/* Native selector is optional; use entity ID input instead. */}
    }
    this._render();
  }
  _lang(){return cgPickLang(this._config.language,this._hass);}
  _t(k,v){return cgT(this._lang(),k,v);}
  _emit(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:cgOut(this._config)},bubbles:true,composed:true}));}
  _update(patch){this._config=cgConfig({...this._config,...patch});this._emit();this._render();}
  _updateCamera(index,patch){const cams=this._config.cameras.map((c,i)=>i===index?{...c,...patch}:c);this._update({cameras:cams});}
  _field(label,inner,help=''){return `<div class="cg-field"><div class="cg-label">${cgEsc(label)}</div>${inner}${help?`<div class="cg-tiny">${cgEsc(help)}</div>`:''}</div>`;}
  _input(scope,key,label,value){return this._field(label,`<input class="cg-input" type="text" maxlength="100" data-scope="${scope}" data-key="${key}" value="${cgEsc(value)}"/>`);}
  _entityField(index,key,label,help=''){
    const value=this._config.cameras[index][key];
    const rm=this._t('remove',{x:label});
    return this._field(label,`<div class="cg-selector-line"><div class="cg-selector-grow"><div data-entity-slot="${index}:${key}"></div><div class="cg-fallback"><input class="cg-input" type="text" placeholder="${cgEsc(CG_DOMAINS[key][0])}.*" value="${cgEsc(value)}" data-scope="${index}" data-key="${key}"/></div></div>${value?`<button type="button" class="cg-clear" data-clear="${index}:${key}" title="${cgEsc(rm)}" aria-label="${cgEsc(rm)}">${cgIcon('close')}</button>`:''}</div>`,help);
  }
  _check(index,key,label,help=''){
    const c=index==='global'?this._config:this._config.cameras[index];
    return `<div class="cg-row"><label for="cg-${index}-${key}">${cgEsc(label)}${help?`<div class="cg-muted">${cgEsc(help)}</div>`:''}</label><input id="cg-${index}-${key}" type="checkbox" data-scope="${index}" data-key="${key}" ${c[key]?'checked':''}/></div>`;
  }
  _camLabel(cam,i){return cam.name||this._t('camN',{n:i+1});}
  _picker(){
    const c=this._config;
    return c.cameras.length?`<div class="cg-camera-picker">${c.cameras.map((cam,i)=>`<button type="button" class="cg-camera-chip ${i===this._selectedCamera?'active':''}" data-select-camera="${i}">${cgEsc(this._camLabel(cam,i))}</button>`).join('')}</div>`:'';
  }
  // Cameras tab: the camera itself (sources, name, how it appears on the dashboard).
  _camera(index,cam){
    const t=(k,v)=>this._t(k,v);
    return `<section class="cg-camera-group"><div class="cg-camera-head"><strong>${cgEsc(this._camLabel(cam,index))}</strong><div class="cg-controls"><button type="button" class="cg-action" data-move="${index}:-1" aria-label="${cgEsc(t('mvUp'))}" ${index===0?'disabled':''}>↑</button><button type="button" class="cg-action" data-move="${index}:1" aria-label="${cgEsc(t('mvDn'))}" ${index===this._config.cameras.length-1?'disabled':''}>↓</button><button type="button" class="cg-clear" data-delete="${index}" aria-label="${cgEsc(t('delCam'))}">${cgIcon('close')}</button></div></div>`+
      this._entityField(index,'camera_entity',t('fLive'),t('fLiveH'))+
      this._entityField(index,'image_entity',t('fImg'),t('fImgH'))+
      this._input(index,'name',t('fName'),cam.name)+
      this._check(index,'show_preview',t('ckPrev'),t('ckPrevH'))+
      this._check(index,'live_preview',t('ckLive'),t('ckLiveH'))+'</section>';
  }
  _tabCameras(c){
    const t=(k,v)=>this._t(k,v);
    return `<div class="cg-heading">${cgEsc(t('tCam'))}</div><div class="cg-desc">${cgEsc(t('camDesc'))}</div>`+this._picker()+
      (c.cameras[this._selectedCamera]?this._camera(this._selectedCamera,c.cameras[this._selectedCamera]):`<div class="cg-muted">${cgEsc(t('noCam'))}</div>`)+
      `<button type="button" class="cg-action cg-add" data-add="1">${cgEsc(t('add'))}</button>`+
      `<div class="cg-muted">${cgEsc(t('noLimit'))}</div>`;
  }
  _mod(name,desc,inner){return `<div class="cg-mod"><div class="cg-mod-nm">${cgEsc(name)}</div>${desc?`<div class="cg-muted cg-mod-d">${cgEsc(desc)}</div>`:''}<div class="cg-mod-b">${inner}</div></div>`;}
  // Modules tab: optional functions of the selected camera, then the settings shared by the whole card.
  _tabModules(c){
    const t=(k,v)=>this._t(k,v);
    let h=`<div class="cg-heading">${cgEsc(t('tMod'))}</div><div class="cg-desc">${cgEsc(t('modDesc'))}</div>`+this._picker();
    const i=this._selectedCamera;
    if(c.cameras[i]){
      h+=this._mod(t('mMotion'),t('mMotionH'),this._entityField(i,'motion_entity',t('fMotion'))+this._entityField(i,'last_event_entity',t('fLast')))+
        this._mod(t('mAudio'),t('mAudioH'),this._entityField(i,'audio_state_entity',t('fAudSt'))+this._entityField(i,'audio_control_entity',t('fAudCt'),t('fAudCtH'))+this._check(i,'audio_control_enabled',t('ckAud'),t('ckAudH')))+
        this._mod(t('mRec'),t('mRecH'),this._entityField(i,'recording_state_entity',t('fRecSt'))+this._entityField(i,'recording_control_entity',t('fRecCt'),t('fRecCtH'))+this._check(i,'recording_control_enabled',t('ckRec'),t('ckRecH')))+
        this._mod(t('mBat'),t('mBatH'),this._entityField(i,'battery_entity',t('fBat')))+
        this._mod(t('mAuto'),t('mAutoH'),this._check(i,'auto_popup',t('ckAuto'),t('ckAutoH')));
    } else h+=`<div class="cg-muted">${cgEsc(t('noCam'))}</div>`;
    h+=`<div class="cg-heading">${cgEsc(t('allCams'))}</div><div class="cg-desc">${cgEsc(t('allCamsH'))}</div>`+
      this._mod(t('mCmd'),t('mCmdH'),this._check('global','controls_enabled',t('ckCmd'),t('ckCmdH')))+
      this._mod(t('mAuto'),'',this._check('global','auto_popup_enabled',t('ckAutoG'),t('ckAutoGH'))+this._field(t('fSecs'),`<input class="cg-input" type="number" min="5" max="60" data-scope="global" data-key="auto_popup_seconds" value="${c.auto_popup_seconds}"/>`))+
      `<div class="cg-muted" style="margin-top:18px">${cgEsc(t('noteHidden'))}</div>`;
    return h;
  }
  _tabLook(c){
    const t=(k,v)=>this._t(k,v);
    const sel=(key,opts,cur)=>`<select class="cg-input" data-scope="global" data-key="${key}">${opts.map(([val,label])=>`<option value="${val}" ${cur===val?'selected':''}>${cgEsc(label)}</option>`).join('')}</select>`;
    const layout=sel('layout',[['auto',t('layAuto')],['1',t('lay1')],['2',t('lay2')],['4',t('lay4')],['custom',t('layCustom')]],c.layout);
    const themes=sel('theme_mode',[['auto',t('thAuto')],['light','Light Edera'],['dark','Dark Edera']],c.theme_mode);
    const langs=sel('language',[['auto',t('langAuto')],...CG_LANGS],c.language);
    return `<div class="cg-heading">${cgEsc(t('tAsp'))}</div>`+
      this._check('global','show_eyebrow',t('ckEye'))+(c.show_eyebrow?this._input('global','eyebrow',t('fEye'),c.eyebrow):'')+
      this._check('global','show_title',t('ckTitle'))+(c.show_title?this._input('global','title',t('fTitle'),c.title==null?t('defTitle'):c.title):'')+
      this._field(t('fTheme'),themes)+this._field(t('fLayout'),layout)+
      (c.layout==='custom'?this._field(t('fCols'),`<input class="cg-input" type="number" min="1" max="12" data-scope="global" data-key="custom_columns" value="${c.custom_columns}"/>`):'')+
      this._field(t('lang'),langs,t('langH'));
  }
  _render(){
    if(!this.isConnected)return;
    const c=this._config;
    // Home Assistant supplies top-level Configurazione, Visibilità and Layout tabs.
    const tabs=[['telecamere',this._t('tCam')],['moduli',this._t('tMod')],['aspetto',this._t('tAsp')]];
    const body=this._tab==='telecamere'?this._tabCameras(c):this._tab==='moduli'?this._tabModules(c):this._tabLook(c);
    this.shadowRoot.innerHTML=`<style>${CG_EDITOR_CSS}</style><div class="cg-editor"><div class="cg-tabs" role="group" aria-label="${cgEsc(this._t('secs'))}">${tabs.map(([id,label])=>`<button type="button" class="cg-tab ${this._tab===id?'active':''}" data-tab="${id}">${cgEsc(label)}</button>`).join('')}</div>${body}</div>`;
    this.shadowRoot.querySelector('.cg-editor').classList.toggle('cg-no-native',!customElements.get('ha-selector'));
    this._mountSelectors();
  }
  _mountSelectors(){
    if(!customElements.get('ha-selector'))return;
    this.shadowRoot.querySelectorAll('[data-entity-slot]').forEach(slot=>{
      const [idx,key]=slot.dataset.entitySlot.split(':');const index=Number(idx);
      const selector=document.createElement('ha-selector');selector.hass=this._hass;
      const domains=CG_DOMAINS[key];selector.selector={entity:{domain:domains.length===1?domains[0]:domains}};
      selector.value=this._config.cameras[index]?.[key]||'';
      selector.setAttribute('aria-label',key);
      selector.addEventListener('value-changed',e=>{
        e.stopPropagation();
        if(!selector.isConnected||!e.detail||!Object.prototype.hasOwnProperty.call(e.detail,'value'))return;
        const value=cgEntity(e.detail.value,domains);this._updateCamera(index,{[key]:value});
      });
      slot.appendChild(selector);
    });
  }
  _click(event){
    const tab=event.target.closest('[data-tab]');if(tab){this._tab=tab.dataset.tab;this._render();return;}
    const select=event.target.closest('[data-select-camera]');if(select){this._selectedCamera=Number(select.dataset.selectCamera);this._render();return;}
    const clear=event.target.closest('[data-clear]');if(clear){const [i,key]=clear.dataset.clear.split(':');this._updateCamera(Number(i),{[key]:''});return;}
    const add=event.target.closest('[data-add]');if(add){this._selectedCamera=this._config.cameras.length;this._update({cameras:[...this._config.cameras,cgCamera()]});return;}
    const del=event.target.closest('[data-delete]');if(del){const index=Number(del.dataset.delete);this._selectedCamera=Math.max(0,Math.min(index,this._config.cameras.length-2));this._update({cameras:this._config.cameras.filter((_,i)=>i!==index)});return;}
    const move=event.target.closest('[data-move]');if(move){const [idx,d]=move.dataset.move.split(':').map(Number);const cams=[...this._config.cameras];const next=idx+d;if(next<0||next>=cams.length)return;[cams[idx],cams[next]]=[cams[next],cams[idx]];this._selectedCamera=next;this._update({cameras:cams});}
  }
  _change(event){
    const el=event.target,key=el.dataset?.key,scope=el.dataset?.scope;if(!key||scope===undefined)return;
    const value=el.type==='checkbox'?el.checked:el.type==='number'?Number(el.value):el.value;
    if(scope==='global'){if(!(key in CG_DEFAULTS))return;this._update({[key]:value});return;}
    const index=Number(scope);if(!Number.isInteger(index)||!this._config.cameras[index]||!(key in cgCamera()))return;
    const v=CG_DOMAINS[key]?cgEntity(value,CG_DOMAINS[key]):value;
    this._updateCamera(index,{[key]:v});
  }
}
if(typeof customElements!=='undefined'){
  if(!customElements.get(CG_TAG))customElements.define(CG_TAG,CameraGridViewCard);
  if(!customElements.get(CG_EDITOR_TAG))customElements.define(CG_EDITOR_TAG,CameraGridViewCardEditor);
}
if(typeof window!=='undefined'){
  window.customCards=window.customCards||[];
  if(!window.customCards.some(c=>c.type===CG_TAG))window.customCards.push({type:CG_TAG,name:'Camera Grid View Card',description:'Edera camera gallery with snapshot and live popup, audio and privacy-first previews.',preview:true});
}
export {cgConfig,cgImageUrl,cgLatestMovement,cgTime,cgBoolState,cgIsPhone,cgT,cgPickLang,CG_TR,CG_LANGS,CG_DOMAINS};
