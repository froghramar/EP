import type { FileViewerProps, FileTypeConfig } from '../../types/fileTypes';
import { BPMNViewer } from '../BPMNViewer';

const BPMN_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
                   xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
                   xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
                   xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
                   id="Definitions_1" 
                   targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

export const bpmnViewerConfig: FileTypeConfig = {
  id: 'bpmn',
  extensions: ['.bpmn'],
  supportedModes: ['editor'],
  defaultMode: 'editor',
  component: BPMNFileViewer,
  getInitialContent: () => BPMN_TEMPLATE,
  getMonacoLanguage: () => 'xml',
};

export function BPMNFileViewer({ content, onContentChange }: FileViewerProps) {
  return (
    <div className="h-full w-full">
      <BPMNViewer content={content} onContentChange={onContentChange} />
    </div>
  );
}
