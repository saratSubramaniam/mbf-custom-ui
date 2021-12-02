import { Component, OnInit, ViewChild, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _config from '../../config';
import { Observable } from 'rxjs/internal/Observable';
import { deployPath } from '../../../environments/environment';
import * as AdaptiveCards from 'adaptivecards';
import { DomSanitizer } from '@angular/platform-browser';
import { SwiperOptions } from 'swiper/types/swiper-options';

@Component({
  selector: 'app-bot',
  templateUrl: `./bot.component.html`,
  styleUrls: ['./bot.component.css']
})

export class BotComponent implements OnInit {
  constructor(
    private _httpClient: HttpClient,
    private _domSanitizer: DomSanitizer,
    private _renderer: Renderer2
  ) { }

  @ViewChild('chatBox') chatBox: any;

  deployPath = deployPath;
  conversationId = '';
  webSocketStreamURL = '';
  // chats: any[] = [{ type: 2, text: 'Typing', displayType: 'loader', buttons: [] }];
  chats: any[] = [];
  showBotLoader = true;
  showChatBotInvokeError = false;
  showQuickLinks = false;
  socket: WebSocket | undefined;
  showRefresh = false;

  proactiveTimeout: any;
  activityTimeout: any;

  requestManager: any = [null];

  config: SwiperOptions = {
    slidesPerView: 1,
    keyboard: true,
    mousewheel: true,
    navigation: true,
    spaceBetween: 20
  };

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
            compInstance.showRefresh = true;
            compInstance.showBotLoader = false;
            compInstance.showStaticChats();
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

  showStaticChats(): void {
    for (let staticChat of _config.staticChats) {
      this.renderChat(JSON.stringify(staticChat));
    }
  }

  botInvokeError(): void {
    this.showChatBotInvokeError = true;
    this.showBotLoader = false;
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
      if (this.chats[this.chats.length - 1]?.displayType === 'loader') {
        this.showBotLoader = false;
        this.botInvokeError();
      }
    }, 50000);
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
        'id': 'default-user-13',
        'name': 'User'
      }
    };

    if (chatString.length > 0) {
      //Disable all previous bot responses
      this.chats.filter(
        (chat: any) => chat.type == 1 && !chat.isDisabled && (chat.isDisabled = true)
      )

      this.showBotLoader = true;

      const el = document.getElementsByClassName('chat-list-holder')[0];
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 0);

      this.chats.push(
        { type: 0, text: chatString, displayType: 'text', buttons: [] }
      );

      const loaderItem = this.chats.filter((chat: any) => chat.displayType === 'loader');
      if (loaderItem.length > 0) {
        this.chats.splice(this.chats.indexOf(loaderItem[0]), 1);
      }

      this.chats.push(
        { type: 2, text: 'Typing', displayType: 'loader', buttons: [] }
      );

      this.sendReq(url, type, body, options).subscribe(
        (res: any) => {
          this.checkActivityTimeout();
          // console.log(res);
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
    if (!this.showBotLoader && !this.showChatBotInvokeError) {
      event.preventDefault();
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        this.sendChat(null);
      }
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

        // Remove the loader element, if it exists
        const loaderItem = this.chats.filter((chat: any) => chat.displayType === 'loader');
        if (loaderItem.length > 0) {
          this.chats.splice(this.chats.indexOf(loaderItem[0]), 1);
        }

        if (item.attachments && item.attachments.length > 0) {
          chatObj.displayType = 'button';
          if (item.attachmentLayout == "carousel") {
            this.renderCarousel(chatObj, item.attachments);
          } else {
            this.renderButtons(chatObj, item.attachments);
          }
        } else if (item.suggestedActions?.actions.length > 0) {
          chatObj.displayType = 'button';
          this.renderActions(chatObj, item.suggestedActions?.actions);
        } else if (item.text.length > 0) {
          this.chats.push(chatObj);
        }
      }

      const el = document.getElementsByClassName('chat-list-holder')[0];
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
        this.showBotLoader = false;
      }, 0);
    } else if (socketData.activities[0]?.type == "typing") {
      // Show the loader element, if it doesn't exist
      const loaderItem = this.chats.filter((chat: any) => chat.displayType === 'loader');
      if (loaderItem.length == 0) {
        this.chats.push(
          { type: 2, text: 'Typing', displayType: 'loader', buttons: [] }
        );

        const el = document.getElementsByClassName('chat-list-holder')[0];
        setTimeout(() => {
          el.scrollTop = el.scrollHeight;
          this.showBotLoader = false;
        }, 0);
      }
    }
  }

  renderCarousel(chatObj: any, attachments: Array<any>): void {
    chatObj.buttonType = "AdaptiveCardCarousel";

    for (const item of attachments) {
      // 1. create an instance of adaptive cards
      let adaptiveCard = new AdaptiveCards.AdaptiveCard();
      // 2. parse the json payload
      adaptiveCard.parse(item.content);
      // 3. render the card 
      let adaptiveCardContent: any = adaptiveCard.render();
      adaptiveCardContent = this._domSanitizer.bypassSecurityTrustHtml(adaptiveCardContent.innerHTML);

      chatObj.buttons.push({
        adaptiveCardContent: adaptiveCardContent
      });
    }

    setTimeout(() => {
      var adaptiveCardButtons: any = document.getElementsByClassName('chat-list-holder')[0].getElementsByClassName('ac-pushButton');

      for (let button of adaptiveCardButtons) {
        this._renderer.listen(
          button,
          'click',
          () => {
            this.sendChat(button.innerText);
          }
        );
      }
    }, 0);

    this.chats.push(chatObj);
  }

  renderActions(chatObj: any, actions: Array<any>): void {
    chatObj.buttonType = 'ActionButton';

    chatObj.buttons = actions;
    this.chats.push(chatObj);
  }

  renderButtons(chatObj: any, attachments: Array<any>): void {
    for (const item of attachments) {

      switch (item.contentType) {

        case 'application/vnd.microsoft.card.hero':
          chatObj.buttonType = 'ActionButton';

          if (!chatObj.text || chatObj.text.length === 0) {
            chatObj.text = item.content.text;
          }

          chatObj.buttons = item.content.buttons;

          break;

        case "application/vnd.microsoft.card.adaptive":
          chatObj.buttonType = "AdaptiveCard";
          // 1. create an instance of adaptive cards
          let adaptiveCard = new AdaptiveCards.AdaptiveCard();
          // 2. parse the json payload
          adaptiveCard.parse(item.content);
          // 3. render the card 
          let adaptiveCardContent: any = adaptiveCard.render();
          chatObj.adaptiveCardContent = this._domSanitizer.bypassSecurityTrustHtml(adaptiveCardContent.innerHTML);

          break;

        case 'application/pdf':
        case 'application/xlsx':
        case 'application/xls':
        case 'application/docx':
          chatObj.buttonType = 'FileDownload';

          if (!chatObj.text || chatObj.text.length === 0) {
            chatObj.text = item.name;
          }

          chatObj.buttons.push({
            name: item.name,
            contentUrl: item.contentUrl
          });

          break;
      }

      var copyObject = Object.assign({}, chatObj);
      this.chats.push(copyObject);
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

  refreshChat(): void {
    this.socket?.close();
    this.chats = [];
    this.startConversation();
  }
}
