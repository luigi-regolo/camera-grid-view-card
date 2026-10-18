# Camera Grid View Card

**Camera Grid View Card** è una custom card per le dashboard Home Assistant che raccoglie più telecamere in un'unica griglia. Per ogni telecamera è possibile aprire un popup con l'ultima immagine rilevata, il movimento più recente e, quando disponibili, audio e batteria.

Il design è coerente con Security Panel Card e supporta i temi Auto, Light e Dark.

## Funzionalità

- **Griglia flessibile:** 1, 2, 4 telecamere oppure disposizione personalizzata, senza un limite fisso al numero di telecamere configurabili.
- **Anteprime opzionali:** è possibile scegliere separatamente per ogni telecamera se mostrare l'ultima immagine nella dashboard. Le anteprime sono **nascoste per impostazione predefinita**.
- **Apertura immediata:** ogni riquadro mostra il pulsante verde **Apri telecamera** per accedere ai dettagli.
- **Popup dedicato:** immagine più recente (`image.*`), data dell'ultimo movimento e pulsante per aprire i dettagli dell'immagine.
- **Audio facoltativo:** visualizzazione dello stato e, quando l'integrazione espone un'entità comandabile e l'utente abilita i comandi, possibilità di attivarlo o disattivarlo.
- **Batteria facoltativa:** la voce è nascosta quando non è configurato o disponibile un valore valido.
- **Configurazione grafica:** editor Home Assistant con sezioni **Telecamere**, **Aspetto** e **Avanzate**, selettori delle entità e opzioni aggiuntive espandibili.
- **Temi:** Auto, Light e Dark con stile visivo Edera.

La card visualizza **snapshot**, non avvia automaticamente streaming live e non registra video o audio.

## Configurazione visuale

Dall'editor della scheda:

1. In **Telecamere**, aggiungere i dispositivi e selezionare per ciascuno l'entità `image.*` dell'ultima immagine.
2. Assegnare un nome visualizzato e scegliere se mostrare l'anteprima nella dashboard.
3. Aprire **Altre opzioni** per collegare movimento, data evento, stato audio, controllo audio e batteria, quando disponibili.
4. In **Aspetto**, scegliere titolo, tema e disposizione della griglia.
5. In **Avanzate**, abilitare i comandi reali solo se necessari e dopo aver verificato le entità configurate.

Le entità facoltative possono essere lasciate vuote. Il controllo audio richiede un'entità `switch.*` o `input_boolean.*` realmente collegata alla funzione audio del dispositivo. I sensori in sola lettura non permettono l'esecuzione di comandi.

## Installazione tramite HACS

L'installazione può essere eseguita aggiungendo il repository come **archivio personalizzato** HACS:

1. In Home Assistant aprire **HACS → ⋮ → Archivi personalizzati**.
2. Inserire `https://github.com/luigi-regolo/camera-grid-view-card`.
3. Selezionare la categoria **Dashboard**, aggiungere l'archivio e installare **Camera Grid View Card**.
4. Ricaricare la pagina di Home Assistant e aggiungere la scheda dalla dashboard.

Se la risorsa non viene registrata automaticamente, verificare che sia presente `/hacsfiles/camera-grid-view-card/camera-grid-view-card.js` come **Modulo JavaScript** nelle risorse della dashboard.

L'utilizzo come archivio personalizzato **non significa** che il repository sia già incluso nel catalogo HACS predefinito.

## Configurazione YAML facoltativa

La card può essere configurata dall'interfaccia grafica senza scrivere YAML. Il seguente esempio mostra i campi principali con identificativi **fittizi**:

```yaml
type: custom:camera-grid-view-card
title: Telecamere
theme_mode: auto
layout: '4'
controls_enabled: false
cameras:
  - name: Ingresso
    image_entity: image.ingresso_demo
    motion_entity: binary_sensor.movimento_ingresso_demo
    show_preview: false
  - name: Giardino
    image_entity: image.giardino_demo
    show_preview: true
```

## Sicurezza e privacy

- Senza anteprima, la scheda non crea l'elemento immagine nella griglia e non richiede lo snapshot finché non viene aperto il popup.
- La scelta di nascondere le immagini è una **protezione visiva**, non una limitazione dei permessi Home Assistant. Gli utenti già autorizzati possono accedere alle entità anche da altre interfacce.
- Le immagini sono caricate da URL relativi alla stessa origine di Home Assistant; la card non incorpora servizi di analisi, telemetria o librerie JavaScript remote.
- I comandi audio sono **disattivati di default**. Occorre abilitarli a livello globale e per ogni telecamera interessata. Sono soggetti alle autorizzazioni Home Assistant.
- L'ultimo movimento è ricavato dal sensore e da eventuali timestamp disponibili; se necessario la card consulta la cronologia Recorder all'apertura del popup. Quando non ci sono dati affidabili mostra **Non disponibile**.
- Dispositivi e integrazioni possono usare servizi cloud propri, indipendenti dalla card.

La versione corrente `0.1` è una versione di sviluppo: prima dell'uso in ambienti critici è consigliata la verifica con le entità dell'installazione Home Assistant interessata.

## Test e sviluppo

È richiesto Node.js 20 o successivo per i test del progetto:

```bash
npm run check
npm test
```

## Segnalazioni

Eventuali problemi possono essere segnalati nella sezione [Issues del repository](https://github.com/luigi-regolo/camera-grid-view-card/issues). Prima di condividere log, immagini o configurazioni, rimuovere credenziali, token, indirizzi e altri dati personali.

## Licenza

GNU GPL-3.0-only — consultare [LICENSE](LICENSE).
