import {accountStorage} from './AccountStorage';
import { sys } from 'cc';
import { SavePort } from '../core/GameSession';
export class LocalSave implements SavePort {
  private store=accountStorage();
  private key = 'starisle.grade2.chapter-one.v2';
  read() { return this.store.getItem(this.key); }
  write(value: string) { this.store.setItem(this.key, value); }
}
