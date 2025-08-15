import React from 'react'

export default function ScrapperLogo(props) {
    return(  
          <svg
        width={props.width ? props.width :'48px'}
        height={props.height ? props.height :'48px'}
        viewBox="0 0 1024 1024"
        data-aut-id="icon"
        className
        fillRule="evenodd"
      >
        <path
          className="scrapper-icon"
          d="M512 128l256 256h-128v256h128l-256 256-256-256h128v-256h-128l256-256zM320 768h384v64h-384v-64zM384 640h256v64h-256v-64z"
        />
      </svg>)
}
