import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  @Output() startChatEvent = new EventEmitter<string>();
  fadeOut = false;

  startChat() {
    setTimeout(() => {
      this.startChatEvent.emit();
    }, 400);
  }
}
