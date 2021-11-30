import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _config from '../../config';
import { Observable } from 'rxjs/internal/Observable';
import { deployPath } from '../../../environments/environment';

@Component({
  selector: 'app-bot-component',
  templateUrl: `./bot.component.html`,
  styleUrls: ['./bot.component.css']
})

export class BotComponent implements OnInit {
  constructor(
    private _httpClient: HttpClient
  ) { }

  @ViewChild('chatBox') chatBox: any;
  @Output('triggerClose') triggerClose: EventEmitter<any> = new EventEmitter();

  deployPath = deployPath;
  conversationId = '';
  webSocketStreamURL = '';
  chats: any[] = [{ type: 2, text: 'Typing', displayType: 'loader', buttons: [] }];
  showBotLoader = true;
  showChatBotInvokeError = false;
  showQuickLinks = false;
  socket: WebSocket | undefined;

  proactiveTimeout: any;
  activityTimeout: any;

  requestManager: any = [null];

  ngOnInit(): void {
    this.startConversation();
  }

  startConversation(): void {
    const url = _config.baseURL;
    const type = _config.methodTypes.POST;

    const options: any = {
      'headers': {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + _config.token
      }
    };

    this.sendReq(url, type, {}, options).subscribe(
      (data: any) => {
        this.conversationId = data.conversationId;
        this.webSocketStreamURL = data.streamUrl;
        this.initializeWebSocket();
      },
      (error: any) => {
        console.log(error);
        this.showBotLoader = false;
        this.botInvokeError();
      }
    );
  }

  initializeWebSocket(): void {
    const compInstance = this;
    if ((window: any) => window.WebSocket) {
      console.log('WebSocket object is supported in your browser.');
      try {
        if (WebSocket) {
          this.socket = new WebSocket(
            // this.webSocketStreamURL
            _config.socketURL + '/' + this.conversationId + '/stream?t=' + _config.token
          );
          this.socket.onopen = function () {
            console.log('onopen');
            compInstance.showBotLoader = false;
            // compInstance.checkProactiveTimeout();
          };
          this.socket.onmessage = function (e) {
            console.log('echo from server : ' + e.data);
            if (e.data.length > 0) {
              compInstance.renderChat(e.data);
            }
          };

          this.socket.onclose = function () {
            console.log('onclose');
          };
          this.socket.onerror = function () {
            console.log('onerror');
            compInstance.showBotLoader = false;
            compInstance.botInvokeError();
          };
        }
      } catch (ex) {
        console.log(ex);
        console.log('WebSocket object is not supported in your network.');
        compInstance.showBotLoader = false;
        compInstance.botInvokeError();
      }
    } else {
      console.log('WebSocket object is not supported in your browser.');
      compInstance.showBotLoader = false;
      compInstance.botInvokeError();
    }
  }

  botInvokeError(): void {
    this.showChatBotInvokeError = true;
    this.chats.splice(this.chats.length - 1, 1);
    this.chats.push({
      type: 1,
      text: _config.genericError,
      displayType: 'text',
      buttons: []
    });
  }

  botActivityError(): void {
    this.showBotLoader = false;
    this.chats.splice(this.chats.length - 1, 1);
    this.chats.push({
      type: 1,
      text: _config.activityError,
      displayType: 'text',
      buttons: []
    });
  }

  checkActivityTimeout(): void {
    this.activityTimeout = setTimeout(() => {
      if (this.chats[this.chats.length - 1].displayType === 'loader') {
        this.showBotLoader = false;
        this.botInvokeError();
      }
    }, 30000);
  }

  sendChat(buttonText: any): void {
    let chatString = '';
    if (buttonText) {
      chatString = buttonText;
    } else {
      chatString = this.chatBox.nativeElement.value;
    }
    const url = _config.baseURL + '/' + this.conversationId + '/activities';
    const type = _config.methodTypes.POST;

    const options: any = {
      'headers': {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + _config.token
      }
    };

    const body = {
      'type': 'message',
      'text': chatString,
      'from': {
        'id': 'default-user',
        'name': 'User'
      }
    };

    if (chatString.length > 0) {
      this.showBotLoader = true;

      const el = document.getElementsByClassName('chat-list-holder')[0];
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);

      this.chats.push(
        { type: 0, text: chatString, displayType: 'text', buttons: [] }
      );

      this.chats.push(
        { type: 2, text: 'Typing', displayType: 'loader', buttons: [] }
      );

      this.sendReq(url, type, body, options).subscribe(
        (res: any) => {
          this.checkActivityTimeout();
          console.log(res);
        },
        (error: any) => {
          console.log(error);
          this.botActivityError();
        }
      );

      this.chatBox.nativeElement.value = '';
    }
  }

  enterPressed(event: any): void {
    event.preventDefault();
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13) {
      this.sendChat(null);
    }
  }

  renderChat(socketData: any): void {
    clearTimeout(this.proactiveTimeout);
    clearTimeout(this.activityTimeout);

    socketData = JSON.parse(socketData);
    let chatObj: any;

    if (socketData.activities && socketData.activities.length > 0 && socketData.watermark) {
      for (const item of socketData.activities) {
        chatObj = {
          type: 1,
          text: item.text,
          displayType: 'text',
          buttons: []
        };

        const loaderItem = this.chats.filter((chat: any) => chat.displayType === 'loader');
        if (loaderItem.length > 0) {
          this.chats.splice(this.chats.indexOf(loaderItem[0]), 1);
        }

        if (item.attachments && item.attachments.length > 0) {
          chatObj.displayType = 'button';
          this.renderButtons(chatObj, item.attachments);
        } else if (item.text.length > 0) {
          this.chats.push(chatObj);
        }
      }

      const el = document.getElementsByClassName('chat-list-holder')[0];
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
        this.showBotLoader = false;
      }, 0);
    }
  }

  renderButtons(chatObj: any, attachments: Array<any>): void {
    for (const item of attachments) {

      switch (item.contentType) {
        case 'application/vnd.microsoft.card.hero':
          if (!chatObj.text || chatObj.text.length === 0) {
            chatObj.text = item.content.text;
          }

          for (const buttonItem of item.content.buttons) {
            chatObj.buttons.push({
              text: buttonItem.title
            });
          }

          chatObj.buttonType = 'ActionButton';

          break;

        case "application/vnd.microsoft.card.adaptive":
          chatObj.buttonType = "AdaptiveCard";
          chatObj.text = item.content.body.filter((i: any) => i.type == 'TextBlock')[0].text;
          chatObj.imageURL = item.content.body.filter((i: any) => i.type == 'Image')[0].url;
          break;

        case 'application/pdf':
        case 'application/xlsx':
        case 'application/xls':
        case 'application/docx':
          if (chatObj.text.length === 0) {
            chatObj.text = item.name;
          }

          chatObj.buttons.push({
            text: item.name,
            downloadUrl: item.contentUrl
          });

          chatObj.buttonType = 'FileDownload';

          break;
      }

      this.chats.push(chatObj);
    }
  }

  downloadFile(fileUrl: string): void {
    window.open(fileUrl, '_blank', 'toolbar=yes,top=500,left=500,width=400,height=400');
  }

  sendReq(url: string, type: any, body: any, options: any): Observable<any> {
    return new Observable<any>((observer: any) => {
      this._httpClient.post(url, body, options).subscribe(
        (res: any) => {
          observer.next(res);
        }),
        (error: any) => {
          console.log(error);
        }
    });
  }

  closeBot(): void {
    this.triggerClose.emit(true);
  }
}
