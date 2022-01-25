import { App } from "electron";
import { BaseProvider, AfterInit, BeforeStart } from "@/app/utils/baseProvider";
import { IpcContext, IpcOn } from "@/app/utils/onIpcEvent";
import TrackProvider from "./trackProvider.plugin";
import { MediaServiceProvider } from "xosms";
import { XOSMS } from "@/app/utils/xosms-types";
import { TrackData } from "@/app/utils/trackData";
import ApiProvider from "./apiProvider.plugin";

@IpcContext
export default class MediaControlProvider extends BaseProvider
  implements AfterInit, BeforeStart {
  private _mediaProvider: MediaServiceProvider;
  private xosmsLog = this.logger.child("xosms");
  constructor(private app: App) {
    super("mediaController");
  }
  async BeforeStart(app?: App) {
    app.commandLine.appendSwitch("disable-features", "MediaSessionService");
  }
  async AfterInit() {
    this._mediaProvider = ((msp) => {
      msp.isEnabled = true;
      return msp;
    })(new MediaServiceProvider(this.app.name, this.app.name));
    if (this._mediaProvider) {
      this._mediaProvider.buttonPressed = (keyName, ...args) => {
        this.xosmsLog.debug(["button press", keyName, ...args]);
        const trackProvider = this.getProvider<ApiProvider>("api");
        if (keyName === "pause") trackProvider.pauseTrack();
        else if (keyName === "play") trackProvider.playTrack();
        else if (keyName === "next") trackProvider.nextTrack();
        else if (keyName === "previous") trackProvider.prevTrack();
      };
    }
    if (!this.mediaProviderEnabled())
      this.xosmsLog.warn(
        [
          "XOSMS is disabled",
          ":: Status:",
          `Provider: ${!!this
            ._mediaProvider}, Enabled: ${this.mediaProviderEnabled()}`,
        ].join(", ")
      );
  }

  @IpcOn("track:play-state")
  private __handleTrackMediaOSControl(_ev, isPlaying: boolean) {
    if (!this.mediaProviderEnabled()) return;

    const { trackData } = this.getProvider<TrackProvider>("track");
    if (!trackData) {
      this._mediaProvider.playbackStatus = XOSMS.PlaybackStatus.Stopped;
      this._mediaProvider.playButtonEnabled = true;
      this._mediaProvider.pauseButtonEnabled = false;
    } else {
      this._mediaProvider.playbackStatus = isPlaying
        ? XOSMS.PlaybackStatus.Playing
        : XOSMS.PlaybackStatus.Paused;

      this._mediaProvider.playButtonEnabled = !isPlaying;
      this._mediaProvider.pauseButtonEnabled = isPlaying;
      this.xosmsLog.debug(
        [
          `IsPlaying State: ${isPlaying}`,
          `XOSMS: ${XOSMS.PlaybackStatus[
            this._mediaProvider.playbackStatus
          ]?.toString?.()}`,
        ].join(", ")
      );
    }
  }
  private mediaProviderEnabled() {
    return this._mediaProvider && this._mediaProvider.isEnabled;
  }
  @IpcOn("track:change")
  private __handleTrackMediaOSControlChange(trackData: TrackData) {
    if (!this.mediaProviderEnabled() || !trackData) return;
    const albumThumbnail = trackData.video.thumbnail.thumbnails
      .sort((a, b) => b.width - a.width)
      .find((x) => x.url)?.url;
    this._mediaProvider.mediaType =
      {
        ["Video"]: XOSMS.MediaType.Video,
        ["Music"]: XOSMS.MediaType.Music,
        ["Image"]: XOSMS.MediaType.Image,
      }[trackData.context.category] ?? XOSMS.MediaType.Unknown;
    this._mediaProvider.playbackStatus = XOSMS.PlaybackStatus.Changing;
    this._mediaProvider.albumArtist = trackData.video.author;
    this._mediaProvider.albumTitle = trackData.context.pageOwnerDetails.name;
    this._mediaProvider.artist = trackData.video.author;
    this._mediaProvider.setThumbnail(XOSMS.ThumbnailType.Uri, albumThumbnail);
    this._mediaProvider.title = trackData.video.title;
    this._mediaProvider.trackId = trackData.video.videoId;
    this._mediaProvider.previousButtonEnabled = true;
    this._mediaProvider.nextButtonEnabled = true;
    this.logger.debug([
      this._mediaProvider.title,
      XOSMS.MediaType[this._mediaProvider.mediaType].toString(),
      this._mediaProvider.trackId,
    ]);
  }
}
