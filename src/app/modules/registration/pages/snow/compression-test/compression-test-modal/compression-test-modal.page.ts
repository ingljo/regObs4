import { Component, OnInit, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { CompressionTestDto } from '../../../../../regobs-api/models';
import { IsEmptyHelper } from '../../../../../../core/helpers/is-empty.helper';

@Component({
  selector: 'app-compression-test-modal',
  templateUrl: './compression-test-modal.page.html',
  styleUrls: ['./compression-test-modal.page.scss'],
})
export class CompressionTestModalPage implements OnInit {

  @Input() compressionTest: CompressionTestDto;

  isNew = false;
  compressionTestCopy: CompressionTestDto;
  tapsArray = [];

  constructor(private modalController: ModalController) { }

  ngOnInit() {
    for (let i = 1; i <= 30; i++) {
      this.tapsArray.push(i);
    }
    if (this.compressionTest) {
      this.compressionTestCopy = { ...this.compressionTest };
    } else {
      this.compressionTestCopy = {};
      this.isNew = true;
    }
  }

  tapsFractureVisible() {
    return !(this.isCTNorECTX() || this.isCTVorECTV());
  }

  isCTNorECTX() {
    return this.compressionTestCopy.PropagationTID === 15 || this.compressionTestCopy.PropagationTID === 24;
  }

  isCTVorECTV() {
    return this.compressionTestCopy.PropagationTID === 11 || this.compressionTestCopy.PropagationTID === 21;
  }

  cancel() {
    this.modalController.dismiss();
  }

  ok() {
    this.modalController.dismiss(IsEmptyHelper.isEmpty(this.compressionTestCopy) ? null : this.compressionTestCopy);
  }

  delete() {
    this.modalController.dismiss({ delete: true });
  }

}
