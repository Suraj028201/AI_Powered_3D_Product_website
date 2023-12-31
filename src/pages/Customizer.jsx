import React, {useState, useEffect} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnapshot } from 'valtio';
import config from '../config/config';
import state from '../store';
import {download, logoShirt, stylishShirt} from '../assets';
import { downloadCanvasToImage, reader } from '../config/helpers';
import { EditorTabs, FilterTabs, DecalTypes } from '../config/constants';
import { fadeAnimation, slideAnimation } from '../config/motion';
import { AIpicker, ColorPicker, CustomButton, Tab, FilePicker } from '../components';
import OpenAI from 'openai';

const Customizer = () => {

  const snap = useSnapshot(state);
  const [file, setFile] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatingImg, setGeneratingImg] = useState(false);
  const [activeEditorTab, setActiveEditorTab] = useState('');
  const [activeFilterTab, setActiveFilterTab] = useState({
    logoShirt: true,
    stylishShirt: false
  })

  //show tab content depending on the active tab

  const generateTabContent = () => {
    switch(activeEditorTab){
      case "colorpicker":
        return <ColorPicker />
      case 'filepicker':
        return <FilePicker
                  file={file}
                  setFile={setFile}
                  readFile={readFile}
               />
      case 'aipicker':
        return <AIpicker
                prompt={prompt}
                setPrompt={setPrompt}
                generatingImg={generatingImg}
                handleSubmit={handleSubmit}
                />
      default:
        break;
    }
  }

  const handleSubmit = async (type) => {
    if(!prompt){
      return alert("Please Eneter A Prompt");
    }
    try{
      setGeneratingImg(true);
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      })

      // const openai = new OpenAI.OpenAIApi(configuration);

      const response = await openai.images.generate({
        prompt: prompt,
        n:1,
        size: '1024x1024',
        response_format: 'b64_json'
      })

      console.log(response.data[0])

      const image = response.data[0].b64_json;
      handleDecal(type, `data:image/png;base64,${image}`);
    } catch(error) {
      alert(error);
      console.log(error, 'openai api')
    } finally {
      setGeneratingImg(false);
      setActiveEditorTab('');
    }
  }

  const handleDecal = (type, result) => {
    const decalType = DecalTypes[type];
    state[decalType.stateProperty] = result;

    if(!activeFilterTab[decalType.filterTab]){
      handleActiveFilterTab(decalType.filterTab);
    }
  }

  const readFile = (type) => {
    reader(file).then((result) => {
      handleDecal(type, result);
      setActiveEditorTab('');
    })
  }


  const handleActiveFilterTab = (tabName) => {
    switch(tabName){
      case 'logoShirt':
        state.isLogoTexture = !activeFilterTab[tabName]
        break;
      case 'stylishShirt':
        state.isFullTexture = !activeFilterTab[tabName]
        break;
      default:
        state.isLogoTexture = true;
        state.isFullTexture = false;
        break;
    }

    // after setting the state, activeFilterTab to update Ui

    setActiveFilterTab((prev) => {
      return {
        ...prev,
        [tabName]: !prev[tabName]
      }
    })
  }


  return (
    <AnimatePresence>
      {!state.intro && <>
        <motion.div key='custom' className='absolute top-0 left-0 z-10' {...slideAnimation('left')}>
          <div className='flex items-center min-h-screen'>
            <div className='editortabs-container tabs'>
              {EditorTabs.map((tab) => (
                <Tab
                  key={tab.name}
                  tab={tab}
                  handleClick={() => {setActiveEditorTab(tab.name)}}
                />
              ))}
              {generateTabContent()}
            </div>
          </div>
        </motion.div>
        <motion.div className='absolute z-10 top-5 right-5' {...fadeAnimation}>
          <CustomButton 
            type={'filled'}
            title={'Go Back'}
            handleClick={() => {state.intro = true}}
            customStyles={'w-fit px-4 py-2.5 font-bold text-sm'}
          />
        </motion.div>
        <motion.div className='filtertabs-container' {...slideAnimation('up')}>
          {FilterTabs.map((tab) => (
            <Tab
              key={tab.name}
              tab={tab}
              isFilterTab
              isActiveTab={activeFilterTab[tab.name]}
              handleClick={() => {handleActiveFilterTab(tab.name)}}
            />
          ))}
        </motion.div>
      </>}
    </AnimatePresence>
  )
}

export default Customizer;