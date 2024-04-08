import React, { useEffect, useState } from 'react'
import {  useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import io from "socket.io-client";
import { CopyToClipboard } from "react-copy-to-clipboard"
import { RiLoader3Line } from "react-icons/ri";

const socket = io.connect("/"); //http://localhost:8000

const QuizPage = () => {

  // all state variables
  const [index, setIndex] = useState(0)
  const [gameOver, setgameOver] = useState(false)
  const [roomCopy, setRoomCopy] = useState()
  const [copyStatus, setCopyStatus] = useState(false)
  const [player_1, setPlayer_1] = useState(0)
  const [player_2, setPlayer_2] = useState(0)
  const [loading, setloading] = useState(false)

  const [isCorrect, setisCorrect] = useState(false)
  const [selectedOption, setselectedOption] = useState(null)

  const navigate = useNavigate()

  const selectUser = useSelector(state => state.auth.loggedInUser)

  const location = useLocation()


  const questions = location?.state?.questions
  const p1 = location?.state?.player1
  const p2 = location?.state?.player2
  const roomId = location?.state?.roomDetails?._id
  const lang = location?.state?.lang

  useEffect(() => {
    // updates the ans on both player window
    socket.on("correct_ans", (data) => {
      setPlayer_1(data.p1)
      setPlayer_2(data.p2)
    })

    // for copying the room id
    setRoomCopy(roomId)

    // if the game end from both sides
    socket.on("gameOver", () => {
      setgameOver(true)
    })
  }, [player_1, player_2, gameOver])


  // func to call if user click on the option
  const increase = (q_id, ind, index) => {

    // check if question exceed the length 
    if (index >= questions.length - 1) {
      socket.emit("endGame", { roomId, player_1, player_2, lang,p1,p2 }) // emit means to send data to server send id to server for ending the game

      // listen for the gameOver event from server 
      socket.on("gameOver", () => {
        setgameOver(true)
      })
    }

    // if option is choosed correct
    if (questions[index].correctOptionIndex == ind) {
      setselectedOption(ind)
      socket.emit("check_ans", { userId: selectUser.id, roomId, correct: true })
      setisCorrect(true)
      setTimeout(() => {
        setIndex(index + 1)
       setselectedOption(null) 
        setisCorrect(false)
      }, 1000);
    } else {
      socket.emit("check_ans", { userId: selectUser.id, roomId, correct: false })
      setisCorrect(false)
      setselectedOption(ind)
      setTimeout(() => {
        setisCorrect(false)
        setselectedOption(null)
        setIndex(index + 1)
      }, 1000);
    }
  }

  // copy room id code
  const copyText = () => {
    setCopyStatus(true)
    console.log(roomCopy);
    setTimeout(() => {
      setCopyStatus(false)
    }, 2000);
  }

  // closing game
  const closeGame = () => {
    setloading(true)
    socket.emit("closeGame", { roomId, player_1, player_2, lang,p1,p2 })
    // socket.emit("closeGame", { roomId, player_1, player_2, lang,p1,p2 })
    navigate("/quiz-homepage")
  }
  return (
    <>
      <div className='flex flex-row justify-between'>
        <div className="player bg-red-800 w-full min-h-screen">
          <p className='text-3xl font-extrabold ml-5'>{p1.id == selectUser.id ? "You" : p1.name}</p>
          <p className='p-4 font-bold text-white'>Score: {player_1}</p>
        </div>
        <div className="opponent bg-blue-800 w-full min-h-screen">
          <p className='text-3xl font-extrabold ml-5 '>{p2.id == selectUser.id ? "You" : p2.name}</p>
          <p className='p-4 font-bold text-white'>Score: {player_2}</p>
        </div>
      </div>

      <div className='question mt-16 md:mt-0'>
      {
        p1 !== " " && p2 !== "" && gameOver == false ? <div className='  p-1'>
          {
            <div className="md:w-full w-80 mt-20 md:mt-0 mx-auto bg-white shadow-md p-8 rounded-lg">
              {gameOver == true ? "Game Over" : " "}
              <h2 className="text-xl font-semibold mb-4">{index > questions.length - 1 ?  <div className='flex flex-col items-center space-y-5'> Result Pending <RiLoader3Line className='animate-spin mt-5' /> </div> : questions[index]?.question}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {
                  questions[index]?.options?.map((option, ind) => {
                    return <div className={` flex cursor-pointer items-center space-x-2 p-4 rounded-lg ${selectedOption === ind ? (isCorrect ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-200'} `} onClick={() => increase(questions[index]._id, ind, index)}>
                      <label htmlFor="">{ind+1 +")"}</label>
                      <label id={ind}
                        htmlFor={`option${index}`} className={`text-gray-800 cursor-pointer text-sm md:text-xl `}>{option}</label>
                    </div>
                  })
                }
              </div>
            </div>
          }
        </div> : <div className=' question w-80 md:w-[30rem] h-52 mx-auto rounded-3xl bg-white p-5 '>
          {gameOver ?
            <div className='font-bold text-xl md:text-3xl'>
              <div className="box text-center">
                {
                  player_1 > player_2 ? <div>{p1.name} Won the Match with <p className='text-2xl text-green-800 font-extrabold'>{player_1} </p> Score </div> : (player_2 > player_1 ? <div>{p2.name} Won the Match with <span className='text-2xl text-green-800 font-extrabold'>{player_2} </span> Score</div> : (player_1 == player_2 ? <div className='text-lg text-green-950 font-extrabold'> Match Is Drawn </div> : null))
                }
              </div>
              <button className='mt-5 relative left-[38%] md:left-[44%] text-lg w-fit  rounded-3xl border border-2 border-black px-2' onClick={closeGame}>
                {loading ? <RiLoader3Line /> : "Close"}
              </button>
            </div>
            : <div className='bg-white p-4 question '>
              <p className='font-semibold'>Send this room id to your friend</p>
              <p className='text-xl font-bold' onChange={(e) => setRoomCopy(e.target.value)} >{roomId}</p>
              <CopyToClipboard text={roomCopy} onCopy={copyText} >
                <button className='border-2 border border-black p-2 rounded-lg mt-3'>Copy</button>
              </CopyToClipboard>
              <p className='text-green-500 font-bold'>{copyStatus ? "Room id copied !!! " : " "}</p>
            </div>}

        </div>
      }
      </div>

     
    </>
  )
}

export default QuizPage




