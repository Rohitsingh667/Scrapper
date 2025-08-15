import React, { useEffect, useContext, useState } from 'react'
import Banner from '../Components/Banner/Banner'
import Loading from '../Store/LoadingContext'
// import LoadingPage from '../Components/Loading/Loading'
import Navbar from '../Components/Navbar/Navbar'
import Posts from '../Components/Posts/Posts'
import Footer from '../Components/Footer/Footer'
import Fresh from '../Components/Posts/Fresh'
import './Home.css'
import Filter from '../Components/Filter/Filter'
// import { LoadingContext } from '../Store/LoadingContext'

function Home() {
  // const { loading } = useContext(LoadingContext)
  const [searchQuery,setSearchQuery] = useState([]);
  const [visualResults, setVisualResults] = useState([]);
  const [filters, setFilters] = useState({
        minPrice: '',
        maxPrice: '',
        category: '',
        year: '',
    });

    const handleFilterChange = (filterName, value) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: value,
        }));
    };


  return (
    <div>
      {/* {loading ?   null :<LoadingPage/>}  */}
      <Navbar setSearchQuery={setSearchQuery} setVisualResults={setVisualResults} />
      <Banner />
      <div className="content-container">
                {(searchQuery || visualResults.length > 0) && (
                    <Filter filters={filters} onFilterChange={handleFilterChange} />
                )}
                <Posts
                    searchQuery={searchQuery}
                    filters={filters}
                    visualResults={visualResults}
                />
            </div>
      <Footer />
      
    </div>
  )
}

export default Home