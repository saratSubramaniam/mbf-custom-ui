// Angular Modules
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

// Components
import { AppComponent } from './components/app-component/app.component';
import { BotComponent } from './components/bot-component/bot.component';
import { HeaderComponent } from './components/header-component/header.component';
import { HomeComponent } from './components/home-component/home.component';

// NGX-SWIPER-WRAPPER
import { SwiperModule } from 'ngx-swiper-wrapper';

@NgModule({
  declarations: [
    AppComponent,
    BotComponent,
    HomeComponent,
    HeaderComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    SwiperModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
