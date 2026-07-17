from pydantic import BaseModel, ConfigDict


class FlexibleResult(BaseModel):
    model_config = ConfigDict(extra="allow", arbitrary_types_allowed=True)


class CutPoint(FlexibleResult): pass
class SilenceCutResult(FlexibleResult): pass
class WordTimestamp(FlexibleResult): pass
class TranscriptResult(FlexibleResult): pass
class BeatSyncResult(FlexibleResult): pass
class Scene(FlexibleResult): pass
class SceneDetectResult(FlexibleResult): pass
class ColorSettings(FlexibleResult): pass
class AudioSettings(FlexibleResult): pass
class AutoColorResult(FlexibleResult): pass
class CaptionWord(FlexibleResult): pass
class Caption(FlexibleResult): pass
class AutoCaptionsResult(FlexibleResult): pass
class ZoomKeyframe(FlexibleResult): pass
class AutoZoomResult(FlexibleResult): pass
class ViralSegment(FlexibleResult): pass
class ViralDetectResult(FlexibleResult): pass
class SpeakerSegment(FlexibleResult): pass
class PodcastResult(FlexibleResult): pass
class RepeatSegment(FlexibleResult): pass
class RepeatGroup(FlexibleResult): pass
class RepeatDetectResult(FlexibleResult): pass
class BleepPoint(FlexibleResult): pass
class ProfanityResult(FlexibleResult): pass
class Chapter(FlexibleResult): pass
class AutoChaptersResult(FlexibleResult): pass
class ResizeFormat(FlexibleResult): pass
class AutoResizeResult(FlexibleResult): pass
class BRollSuggestion(FlexibleResult): pass
class BRollResult(FlexibleResult): pass
