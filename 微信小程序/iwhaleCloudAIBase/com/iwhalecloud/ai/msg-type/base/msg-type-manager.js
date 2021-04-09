import IMOperator from "../../im-operator";
import VoiceManager from "../voice-manager";
import TextManager from "../text-manager";
import ImageManager from "../image-manager";
import OpenFileManager from "../open-file-manager";
import ExpertsQuestionsManager from "../experts-questions-manager";

export default class MsgTypeManager {
    constructor(page) {
				this._page = page
        this.voiceManager = new VoiceManager(page);
        this.textManager = new TextManager(page);
        this.imageManager = new ImageManager(page);
				this.openFileManager = new OpenFileManager(page);
				this.expertsQuestionsManager = new ExpertsQuestionsManager(page);
    }

    getMsgManager({type}) {
        var tempManager = null;
        switch (type) {
						case IMOperator.TextType:
						case IMOperator.WebURLType:
						case IMOperator.WebHTMLType:
								tempManager = this.textManager;
						break;

            case IMOperator.VoiceType:
                tempManager = this.voiceManager;
                break;
				 
						case IMOperator.VideoType:
            case IMOperator.ImageType:
                tempManager = this.imageManager;
                break;  

						case IMOperator.FileType: 
								tempManager = this.openFileManager;
								break; 

						case IMOperator.HotQuestions: // 热点问题
						case IMOperator.HotSubQuestions: // 热点子问题
						case IMOperator.ExpertsSelect: // 专家选择
						case IMOperator.ExpertsSeatSelect: // 专家坐席选择
						case IMOperator.Artificial: // 转人工成功
						case IMOperator.Evaluation: // 转人工成功
								tempManager = this.expertsQuestionsManager;
								break; 
		
        }
        return tempManager;
    }

		// 停止播放录音
		stopAllVoice() {
			this.voiceManager.stopAllVoicePlay();
		}

    clear() {
        this.voiceManager = null;
        this.textManager = null;
        this.imageManager = null;
				this.openFileManager = null;
				this.expertsQuestionsManager = null;	
    }
}